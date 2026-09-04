"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Tone = "light" | "dark";

function unwrapMarkdownFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return fenced ? fenced[1].trim() : content;
}

/** Flatten nested **bold** that LLMs often emit, e.g. **Lunch at **Ku De Ta****. */
function flattenNestedBold(line: string): string {
  const match = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)?(\*\*.*\*\*)\s*$/);
  if (!match) return line;

  const prefix = match[1] ?? "";
  const inner = match[2].slice(2, -2);
  if (!inner.includes("**")) return line;
  return `${prefix}**${inner.replace(/\*\*/g, "")}**`;
}

function prepareMarkdown(content: string): string {
  return unwrapMarkdownFence(content).split("\n").map(flattenNestedBold).join("\n");
}

function buildComponents(tone: Tone): Components {
  const dark = tone === "dark";
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-white/80" : "text-slate-600";
  const border = dark ? "border-white/25" : "border-slate-200";

  return {
    h1: ({ children }) => (
      <h3 className={`mt-4 mb-2 text-lg font-bold tracking-tight first:mt-0 ${heading}`}>{children}</h3>
    ),
    h2: ({ children }) => (
      <h4 className={`mt-4 mb-2 text-base font-bold tracking-tight first:mt-0 ${heading}`}>{children}</h4>
    ),
    h3: ({ children }) => (
      <h5 className={`mt-3 mb-1.5 text-sm font-semibold first:mt-0 ${heading}`}>{children}</h5>
    ),
    h4: ({ children }) => (
      <h6 className={`mt-3 mb-1 text-sm font-semibold first:mt-0 ${heading}`}>{children}</h6>
    ),
    p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="my-2 ml-5 list-outside list-disc space-y-1.5 first:mt-0 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-2 ml-5 list-outside list-decimal space-y-1.5 first:mt-0 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
    strong: ({ children }) => <strong className={`font-semibold ${heading}`}>{children}</strong>,
    em: ({ children }) => <em className={`italic ${muted}`}>{children}</em>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`underline underline-offset-2 ${dark ? "text-white" : "text-blue-700"}`}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className={`my-2 border-l-2 pl-3 italic ${border} ${muted}`}>{children}</blockquote>
    ),
    code: ({ className, children }) => {
      const isBlock = Boolean(className);
      if (isBlock) {
        return <code className="block whitespace-pre-wrap font-mono text-xs">{children}</code>;
      }
      return (
        <code
          className={`rounded px-1.5 py-0.5 font-mono text-[0.85em] ${
            dark ? "bg-white/20" : "bg-slate-200/80 text-slate-800"
          }`}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        className={`my-2 overflow-x-auto rounded-xl p-3 ${
          dark ? "bg-black/25" : "bg-slate-900 text-slate-100"
        }`}
      >
        {children}
      </pre>
    ),
    hr: () => <hr className={`my-3 border-t ${border}`} />,
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className={`border px-2.5 py-1.5 font-semibold ${border} ${dark ? "" : "bg-slate-50"}`}>
        {children}
      </th>
    ),
    td: ({ children }) => <td className={`border px-2.5 py-1.5 ${border}`}>{children}</td>,
  };
}

const componentsByTone: Record<Tone, Components> = {
  light: buildComponents("light"),
  dark: buildComponents("dark"),
};

export function MarkdownMessage({
  content,
  tone = "light",
  className = "",
}: {
  content: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentsByTone[tone]}>
        {prepareMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
