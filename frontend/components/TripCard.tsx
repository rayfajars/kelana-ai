import Link from "next/link";
import { categoryBadgeClass } from "@/lib/itinerary";
import type { Trip } from "@/types/trip";

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
        <div className="h-12 w-12 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
          ✈️
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900 truncate">{trip.destination}</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryBadgeClass(trip.category)}`}
            >
              {trip.category}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {trip.days} days · USD {Number(trip.budget).toLocaleString()} · {trip.travel_style}
          </p>
        </div>
      </div>

      <span className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600">
        View Details →
      </span>
    </Link>
  );
}
