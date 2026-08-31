import type { GenerateTripInput, Trip } from "@/types/trip";
import { authHeaders } from "@/lib/auth";

// Read API URL from .env — no more hardcoding
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function readJson<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`, { cache: "no-store", headers: authHeaders() });
  return readJson<Trip[]>(res);
}

export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`, { cache: "no-store", headers: authHeaders() });
  return readJson<Trip>(res);
}

export async function generateTrip(data: GenerateTripInput): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return readJson<Trip>(res);
}
