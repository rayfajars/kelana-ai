import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function TripNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="trips" />
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Trip not found</h1>
        <p className="text-slate-500 mt-2">That itinerary may have been deleted.</p>
        <Link
          href="/trips"
          className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Back to Trip History
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
