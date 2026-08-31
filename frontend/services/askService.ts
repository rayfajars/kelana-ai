const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type AskSource = {
  document_id?: string;
  location?: {
    s3Location?: { uri?: string };
    type?: string;
  };
  metadata?: {
    _document_title?: string;
    _file_type?: string;
    _source_uri?: string;
  };
  score?: number;
};

export type AskResponse = {
  question: string;
  answer: string;
  source: AskSource[];
};

export function sourceTitle(item: AskSource): string {
  return (
    item.metadata?._document_title ||
    item.location?.s3Location?.uri?.split("/").pop() ||
    item.document_id?.split("/").pop() ||
    "Untitled source"
  );
}

export async function askAssistant(question: string): Promise<AskResponse> {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `API error (${res.status})`;
    throw new Error(detail);
  }
  return body as AskResponse;
}
