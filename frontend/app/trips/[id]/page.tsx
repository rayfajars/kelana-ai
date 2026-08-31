"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ItineraryView } from "@/components/ItineraryView";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { categoryBadgeClass } from "@/lib/itinerary";
import { formatUsd } from "@/lib/tripDisplay";
import { getTrip } from "@/services/tripService";
import type { Trip } from "@/types/trip";
import Link from "next/link";

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(tripId)) {
      setMissing(true);
      return;
    }

    getTrip(tripId)
      .then(setTrip)
      .catch((err) => {
        if (err instanceof Error && err.message === "Unauthorized") {
          router.replace("/login");
          return;
        }
        setMissing(true);
      });
  }, [router, tripId]);

  return (
    <RequireAuth>
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="trips" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {missing ? (
          <div className="text-center py-10">
            <h1 className="text-3xl font-bold">Trip not found</h1>
            <p className="text-slate-500 mt-2">That itinerary may have been deleted or belongs to another user.</p>
            <Link
              href="/trips"
              className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Back to Trip History
            </Link>
          </div>
        ) : !trip ? (
          <p className="text-slate-500">Loading itinerary...</p>
        ) : (
          <>
            <div>
              <Link href="/trips" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                ← Back to Trips
              </Link>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                {trip.destination}
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SummaryCard label="Destination" value={trip.destination} />
              <SummaryCard label="Budget" value={formatUsd(trip.budget)} />
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Category</p>
                <span
                  className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-sm font-semibold border ${categoryBadgeClass(trip.category)}`}
                >
                  {trip.category}
                </span>
              </div>
              <SummaryCard label="Days" value={`${trip.days} days`} />
            </div>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                AI Recommendation
              </h2>
              <ItineraryView recommendation={trip.ai_recommendation} />
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
    </RequireAuth>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
