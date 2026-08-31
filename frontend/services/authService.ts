import { authHeaders, getToken, setStoredUser, setToken, type AuthUser } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `API error (${res.status})`;
    throw new Error(detail);
  }
  return body as T;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<AuthUser>(res);
}

export async function loginUser(data: { email: string; password: string }): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const token = await readJson<{ access_token: string; token_type: string }>(res);
  setToken(token.access_token);
  const me = await getMe();
  setStoredUser(me);
}

export async function getMe(): Promise<AuthUser> {
  if (!getToken()) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(`${API_URL}/auth/me`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  return readJson<AuthUser>(res);
}
