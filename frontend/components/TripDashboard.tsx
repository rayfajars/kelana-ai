"use client";

import { useEffect, useMemo, useState } from "react";
import { TripCard } from "@/components/TripCard";
import type { Trip } from "@/types/trip";

type SortMode = "latest" | "oldest" | "budget";

const PAGE_SIZE = 10;

export function TripDashboard({ trips }: { trips: Trip[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("latest");
  const [page, setPage] = useState(1);

  const visibleTrips = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = trips.filter((trip) => {
      if (!q) return true;
      return (
        trip.destination.toLowerCase().includes(q) ||
        trip.travel_style.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    if (sort === "oldest") {
      sorted.sort((a, b) => a.id - b.id);
    } else if (sort === "budget") {
      sorted.sort((a, b) => b.budget - a.budget);
    } else {
      sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [trips, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visibleTrips.length / PAGE_SIZE));
  const pagedTrips = visibleTrips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trips..."
          className="w-full min-h-12 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="w-full sm:w-56 min-h-12 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none transition duration-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 cursor-pointer"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="budget">Highest Budget</option>
        </select>
      </div>

      {visibleTrips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">No trips match your search.</p>
          <p className="text-sm text-slate-500 mt-1">Try another destination or travel style.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pagedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {visibleTrips.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40 hover:border-blue-200"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`min-w-10 px-3 py-2 rounded-xl text-sm font-semibold ${
                n === page
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40 hover:border-blue-200"
          >
            Next
          </button>
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold">
          i
        </span>
        Click any card to open its detail page.
      </p>
    </div>
  );
}
