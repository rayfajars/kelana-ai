"use client";

import { FormEvent, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { askAssistant } from "@/services/askService";

export default function AssistantPage() {
  const [question, setQuestion] = useState("Can I bring medication into Japan?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const result = await askAssistant(text);
      setAnswer(result.answer);
      setSources(
        (result.sources ?? []).map((source) =>
          typeof source === "string" ? source : String((source as { title?: string }).title ?? "")
        ).filter(Boolean)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to get an answer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="assistant" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">KelanaAI</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">Travel Assistant</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ask factual travel questions. Answers are grounded in your uploaded documents.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Can I bring medication into Japan?"
            className="flex-1 min-h-12 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Asking..." : "Ask"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Searching your documents...
          </div>
        )}

        {answer && !loading && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">AI Answer</p>
            <p className="mt-2 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
              {answer}
            </p>
            {sources.length > 0 && (
              <>
                <hr className="my-4 border-emerald-200" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">Source</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {sources.map((source) => (
                    <li
                      key={source}
                      className="inline-flex items-center gap-2.5 rounded-xl bg-white/80 border border-emerald-100 px-3 py-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {source.split(".").pop()?.toUpperCase() ?? "DOC"}
                      </span>
                      <span className="text-sm font-medium text-slate-800 break-all">{source}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">Answers are grounded in your uploaded documents.</p>
      </main>

      <SiteFooter />
    </div>
  );
}
