import { authHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type Conversation = {
  id: number;
  title: string;
  created_at: string;
  ended_at?: string | null;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type SendMessageResult = {
  conversation_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
};

async function readJson<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `API error (${res.status})`;
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/conversations`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  return readJson<Conversation[]>(res);
}

export async function createConversation(): Promise<number> {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await readJson<{ conversation_id: number }>(res);
  return data.conversation_id;
}

export async function renameConversation(id: number, title: string): Promise<Conversation> {
  const res = await fetch(`${API_URL}/conversations/${id}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title }),
  });
  return readJson<Conversation>(res);
}

export async function endConversation(id: number): Promise<Conversation> {
  const res = await fetch(`${API_URL}/conversations/${id}/end`, {
    method: "POST",
    headers: authHeaders(),
  });
  return readJson<Conversation>(res);
}

export async function deleteConversation(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await readJson<{ message: string }>(res);
}

export async function getMessages(id: number): Promise<ChatMessage[]> {
  const res = await fetch(`${API_URL}/conversations/${id}/messages`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  return readJson<ChatMessage[]>(res);
}

export async function sendMessage(id: number, content: string): Promise<SendMessageResult> {
  const res = await fetch(`${API_URL}/conversations/${id}/messages`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ content }),
  });
  return readJson<SendMessageResult>(res);
}

export function formatConversationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
