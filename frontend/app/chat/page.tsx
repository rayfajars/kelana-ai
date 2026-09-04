"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal, TrashIcon } from "@/components/ConfirmModal";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import {
  createConversation,
  deleteConversation,
  endConversation,
  formatConversationDate,
  formatMessageTime,
  getConversations,
  getMessages,
  renameConversation,
  sendMessage,
  titleFromFirstMessage,
  type ChatMessage,
  type Conversation,
} from "@/services/chatService";

const DEFAULT_TITLE = "New conversation";
const NEAR_BOTTOM_PX = 96;

function DownArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10 4v12m0 0-5-5m5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex max-w-[85%] ${isUser ? "self-end" : "self-start"}`}
    >
      <div
        className={`rounded-2xl px-4 py-3 text-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
        }`}
      >
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownMessage content={message.content} />
        )}
        <time
          dateTime={message.created_at}
          className={`mt-2 block text-[11px] ${isUser ? "text-white/70 text-right" : "text-slate-400"}`}
        >
          {formatMessageTime(message.created_at)}
        </time>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="self-start rounded-2xl bg-slate-100 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-label="KelanaAI is typing"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.32s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.16s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
        </span>
        <span className="text-sm text-slate-500">KelanaAI is typing...</span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    { type: "end" } | { type: "delete"; id: number; title: string } | null
  >(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const jumpToLatestRef = useRef(false);
  const stuckToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId]
  );
  const ended = Boolean(activeConversation?.ended_at);

  const handleFailure = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof Error && err.message === "Unauthorized") {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : fallback);
    },
    [router]
  );

  const isNearBottom = useCallback(() => {
    const thread = threadRef.current;
    if (!thread) return true;
    const distance = thread.scrollHeight - thread.scrollTop - thread.clientHeight;
    return distance <= NEAR_BOTTOM_PX;
  }, []);

  const updateJumpButton = useCallback(() => {
    const nearBottom = isNearBottom();
    stuckToBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom && messages.length > 0);
  }, [isNearBottom, messages.length]);

  const scrollThread = useCallback((behavior: ScrollBehavior) => {
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTo({ top: thread.scrollHeight, behavior });
    stuckToBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  const openConversation = useCallback(
    async (id: number) => {
      setActiveId(id);
      setError(null);
      setMessages([]);
      setShowJumpToLatest(false);
      stuckToBottomRef.current = true;
      setLoadingThread(true);
      try {
        const data = await getMessages(id);
        jumpToLatestRef.current = true;
        setMessages(data);
      } catch (err) {
        handleFailure(err, "Unable to load this conversation.");
      } finally {
        setLoadingThread(false);
      }
    },
    [handleFailure]
  );

  useEffect(() => {
    getConversations()
      .then((data) => {
        setConversations(data);
        if (data.length > 0) {
          void openConversation(data[0].id);
        }
      })
      .catch((err) => handleFailure(err, "Unable to load conversations."));
  }, [handleFailure, openConversation]);

  useEffect(() => {
    if (loadingThread) return;

    const jump = jumpToLatestRef.current;
    jumpToLatestRef.current = false;
    const followThread = jump || sending || stuckToBottomRef.current;

    if (!followThread) {
      setShowJumpToLatest(messages.length > 0);
      return;
    }

    const behavior: ScrollBehavior = jump ? "auto" : "smooth";
    scrollThread(behavior);
    const frame = window.requestAnimationFrame(() => scrollThread(behavior));
    return () => window.cancelAnimationFrame(frame);
  }, [messages, sending, loadingThread, scrollThread, messages.length]);

  async function handleNewConversation() {
    setError(null);
    try {
      const id = await createConversation();
      const now = new Date().toISOString();
      setConversations((prev) => [
        { id, title: DEFAULT_TITLE, created_at: now, ended_at: null },
        ...prev,
      ]);
      setActiveId(id);
      setMessages([]);
      setShowJumpToLatest(false);
      stuckToBottomRef.current = true;
    } catch (err) {
      handleFailure(err, "Unable to start a new conversation.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending || ended) return;

    setError(null);
    setSending(true);
    setInput("");

    const pending: ChatMessage = {
      id: -Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, pending]);

    try {
      let conversationId = activeId;
      if (conversationId === null) {
        conversationId = await createConversation();
        setConversations((prev) => [
          {
            id: conversationId as number,
            title: DEFAULT_TITLE,
            created_at: new Date().toISOString(),
            ended_at: null,
          },
          ...prev,
        ]);
        setActiveId(conversationId);
      }

      const result = await sendMessage(conversationId, text);
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== pending.id),
        result.user_message,
        result.assistant_message,
      ]);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId && item.title === DEFAULT_TITLE
            ? { ...item, title: titleFromFirstMessage(text) }
            : item
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== pending.id));
      setInput(text);
      handleFailure(err, "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  async function handleRenameSubmit(event: FormEvent, id: number) {
    event.preventDefault();
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;

    try {
      const updated = await renameConversation(id, title);
      setConversations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      handleFailure(err, "Unable to rename this conversation.");
    }
  }

  function askDeleteConversation(id: number) {
    const target = conversations.find((item) => item.id === id);
    setConfirmAction({ type: "delete", id, title: target?.title ?? "this conversation" });
  }

  async function confirmDialog() {
    if (!confirmAction) return;
    setError(null);
    setConfirmBusy(true);

    try {
      if (confirmAction.type === "end") {
        if (activeId === null) return;
        const updated = await endConversation(activeId);
        setConversations((prev) => prev.map((item) => (item.id === activeId ? updated : item)));
      } else {
        const { id } = confirmAction;
        await deleteConversation(id);
        const remaining = conversations.filter((item) => item.id !== id);
        setConversations(remaining);

        if (id === activeId) {
          setMessages([]);
          setActiveId(null);
          if (remaining.length > 0) {
            void openConversation(remaining[0].id);
          }
        }
      }
      setConfirmAction(null);
    } catch (err) {
      handleFailure(
        err,
        confirmAction.type === "end"
          ? "Unable to end this conversation."
          : "Unable to delete this conversation."
      );
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <SiteHeader current="chat" />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <aside className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col max-h-[75vh]">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Conversations
                </p>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  title="New conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-lg leading-none font-semibold hover:bg-blue-700 cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <p className="px-2 py-6 text-sm text-slate-400 text-center">
                    No conversations yet. Send a message to start one.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {conversations.map((item) => {
                      const active = item.id === activeId;
                      return (
                        <li key={item.id}>
                          {renamingId === item.id ? (
                            <form onSubmit={(event) => handleRenameSubmit(event, item.id)}>
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                onBlur={(event) => handleRenameSubmit(event, item.id)}
                                className="w-full rounded-xl border border-blue-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                              />
                            </form>
                          ) : (
                            <div
                              className={`group flex items-start gap-1 rounded-xl px-3 py-2 transition-colors ${
                                active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => openConversation(item.id)}
                                className="flex-1 min-w-0 text-left cursor-pointer"
                              >
                                <p
                                  className={`truncate text-sm font-semibold ${
                                    active ? "text-blue-800" : "text-slate-700"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                                  {formatConversationDate(item.created_at)}
                                  {item.ended_at && (
                                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                                      Ended
                                    </span>
                                  )}
                                </p>
                              </button>
                              <div className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                <button
                                  type="button"
                                  title="Rename"
                                  onClick={() => {
                                    setRenamingId(item.id);
                                    setRenameValue(item.title);
                                  }}
                                  className="rounded-lg px-1.5 py-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => askDeleteConversation(item.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-white flex flex-col max-h-[75vh]">
              <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-slate-200">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Conversation
                  </p>
                  <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
                    {activeConversation?.title ?? "KelanaAI Chat"}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {ended
                      ? "This conversation is closed and kept as history."
                      : "The backend stores every message and replays it as context."}
                  </p>
                </div>

                {activeId !== null && (
                  <div className="flex shrink-0 items-center gap-2">
                    {!ended && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "end" })}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        End chat
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => askDeleteConversation(activeId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="relative min-h-0 flex-1">
                <div
                  ref={threadRef}
                  onScroll={updateJumpButton}
                  className="h-full overflow-y-auto px-4 sm:px-5 py-5 flex flex-col gap-3"
                >
                  {loadingThread ? (
                    <p className="text-sm text-slate-400">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <div className="m-auto text-center">
                      <p className="text-sm font-semibold text-slate-500">Start the conversation</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try &ldquo;Plan a family trip to Japan.&rdquo; then ask &ldquo;What about Day 2?&rdquo;
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageRow key={message.id} message={message} />
                    ))
                  )}

                  {sending && <TypingIndicator />}
                </div>

                {showJumpToLatest && (
                  <button
                    type="button"
                    title="Jump to latest message"
                    onClick={() => scrollThread("smooth")}
                    className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 cursor-pointer"
                  >
                    <DownArrowIcon />
                  </button>
                )}
              </div>

              {error && (
                <p className="mx-4 sm:mx-5 mb-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              {ended ? (
                <div className="flex flex-col items-center gap-2 border-t border-slate-200 px-4 sm:px-5 py-4 sm:flex-row sm:justify-between">
                  <p className="text-sm text-slate-500">
                    This conversation has ended. Start a new one to keep chatting.
                  </p>
                  <button
                    type="button"
                    onClick={handleNewConversation}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    New conversation
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 border-t border-slate-200 px-4 sm:px-5 py-3"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <button
                    type="submit"
                    disabled={sending || input.trim().length === 0}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                    title="Send"
                  >
                    ➤
                  </button>
                </form>
              )}
            </section>
          </div>
        </main>

        <ConfirmModal
          open={confirmAction !== null}
          busy={confirmBusy}
          title={confirmAction?.type === "end" ? "End this chat?" : "Delete this chat?"}
          description={
            confirmAction?.type === "end"
              ? "You can still read the messages, but no new replies can be sent in this conversation."
              : `“${confirmAction?.title ?? "This conversation"}” and all of its messages will be removed permanently.`
          }
          confirmLabel={confirmAction?.type === "end" ? "End chat" : "Delete chat"}
          onConfirm={() => void confirmDialog()}
          onClose={() => {
            if (!confirmBusy) setConfirmAction(null);
          }}
        />
      </div>
    </RequireAuth>
  );
}
