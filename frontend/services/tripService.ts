import type { GenerateTripInput, Trip } from "@/types/trip";

// Read API URL from .env — no more hardcoding
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`, { cache: "no-store" });
  return readJson<Trip[]>(res);
}

export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`, { cache: "no-store" });
  return readJson<Trip>(res);
}

export async function generateTrip(data: GenerateTripInput): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<Trip>(res);
}
