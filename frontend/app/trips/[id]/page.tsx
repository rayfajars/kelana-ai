import { ItineraryView } from "@/components/ItineraryView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { categoryBadgeClass } from "@/lib/itinerary";
import { formatUsd } from "@/lib/tripDisplay";
import { getTrip } from "@/services/tripService";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const trip = await getTrip(Number(id));
    return { title: `${trip.destination} — KelanaAI` };
  } catch {
    return { title: "Trip not found — KelanaAI" };
  }
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = Number(id);

  if (!Number.isFinite(tripId)) {
    notFound();
  }

  let trip;
  try {
    trip = await getTrip(tripId);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="trips" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
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
      </main>

      <SiteFooter />
    </div>
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
