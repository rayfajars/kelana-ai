import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TripDashboard } from "@/components/TripDashboard";
import { getTrips } from "@/services/tripService";
import Link from "next/link";

export const metadata = {
  title: "Trip History — KelanaAI",
  description: "Saved itineraries generated with KelanaAI",
};

export default async function TripsPage() {
  let trips: Awaited<ReturnType<typeof getTrips>> = [];
  let loadError = false;

  try {
    trips = await getTrips();
    trips = [...trips].sort((a, b) => b.id - a.id);
  } catch {
    loadError = true;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="trips" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Trip History</h1>
          <p className="text-sm text-slate-500">
            {loadError
              ? "Unable to load saved itineraries."
              : trips.length === 1
                ? "1 trip"
                : `${trips.length} trips`}
          </p>
        </div>

        {loadError ? (
          <div className="rounded-2xl bg-linear-to-br from-blue-700 to-slate-900 p-10 text-center text-white">
            <p className="text-xl font-bold">Could not reach the API.</p>
            <p className="text-blue-100 text-sm mt-2">Make sure the FastAPI server is running, then refresh.</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl bg-linear-to-br from-blue-700 via-blue-800 to-slate-900 p-10 sm:p-14 text-center text-white shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl">
              ✈️
            </div>
            <h2 className="text-2xl font-bold">No trips found.</h2>
            <p className="text-blue-100 text-sm mt-2">Create your first itinerary.</p>
            <Link
              href="/#plan"
              className="inline-flex items-center mt-6 px-5 py-2.5 rounded-full bg-white text-blue-800 font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Generate a Trip →
            </Link>
          </div>
        ) : (
          <TripDashboard trips={trips} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
