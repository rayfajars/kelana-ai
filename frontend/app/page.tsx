"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { generateTrip } from "@/services/tripService";

export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [travelStyle, setTravelStyle] = useState("Family");

  const [submittedMeta, setSubmittedMeta] = useState<{
    destination: string;
    budget: string;
    days: string;
    travelStyle: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const snapshot = { destination, budget, days, travelStyle };
    setSubmittedMeta(snapshot);

    try {
      const trip = await generateTrip({
        destination: snapshot.destination,
        budget: Number(snapshot.budget),
        days: Number(snapshot.days),
        travel_style: snapshot.travelStyle,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate itinerary. Please try again."
      );
      setLoading(false);
    }
  }

  const hasContent = loading || error;
  const heroTitle = submittedMeta?.destination || destination.trim() || "Discover your next destination";
  const fieldClass =
    "w-full min-h-12 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="home" />

      <main className="flex-1">
        <section className="relative isolate">
          <div
            className={`relative w-full overflow-hidden ${
              hasContent ? "h-52 sm:h-64 md:h-72" : "h-88 sm:h-112 md:h-128"
            }`}
          >
            <Image
              src="/hero-destination.jpg"
              alt={`${heroTitle} travel destination`}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/45 to-slate-900/25" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pb-20 sm:pb-24">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-sky-200 mb-3">
                AI Travel Planner
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight max-w-3xl text-balance">
                {heroTitle}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-200 max-w-xl text-pretty">
                Daily itineraries, local food, and budget tips — crafted for your travel style.
              </p>
            </div>
          </div>

          <div id="plan" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 scroll-mt-24">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-4 sm:p-6 lg:p-7"
            >
              <div className="mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Plan a Trip</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Enter destination, budget, duration, and style to generate your itinerary.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="min-w-0">
                  <label htmlFor="destination" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Destination
                  </label>
                  <input
                    id="destination"
                    name="destination"
                    type="text"
                    placeholder="e.g. Bandung, Indonesia"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="2000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      required
                      min={1}
                      className={`${fieldClass} pl-8`}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label htmlFor="days" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Duration (Days)
                  </label>
                  <input
                    id="days"
                    name="days"
                    type="number"
                    placeholder="3"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    required
                    min={1}
                    max={30}
                    className={fieldClass}
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="travel_style" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Travel Style
                  </label>
                  <select
                    id="travel_style"
                    name="travel_style"
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value)}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="Family">👨‍👩‍👧‍👦 Family</option>
                    <option value="Solo">🎒 Solo</option>
                    <option value="Couple">💑 Couple</option>
                    <option value="Backpacker">🏕️ Backpacker</option>
                    <option value="Luxury">✨ Luxury</option>
                    <option value="Adventure">🧗 Adventure</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 sm:mt-5 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all duration-200 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Itinerary...</span>
                  </>
                ) : (
                  <span>Generate AI Trip ✨</span>
                )}
              </button>
            </form>
          </div>
        </section>

        {hasContent && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4 space-y-6">
            {submittedMeta && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    📍
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{submittedMeta.destination}</h3>
                    <p className="text-xs text-slate-500">
                      {submittedMeta.days} Days • {submittedMeta.travelStyle} Style
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Total Budget</span>
                    <span className="font-bold text-blue-600 text-base">
                      USD {Number(submittedMeta.budget).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="rounded-2xl p-10 sm:p-12 text-center text-white shadow-lg shadow-blue-900/20 border border-blue-400/20 bg-linear-to-br from-blue-700 via-blue-800 to-slate-900">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-4">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Generating itinerary...</h3>
                <p className="text-blue-100 text-sm mt-1 max-w-md mx-auto">
                  Amazon Bedrock is crafting your daily schedule and recommendations.
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl p-10 text-center text-white shadow-lg border border-blue-400/20 bg-linear-to-br from-blue-700 to-slate-900">
                <div className="text-4xl mb-3">☁️</div>
                <h3 className="text-xl font-bold">Unable to generate itinerary.</h3>
                <p className="text-blue-100 text-sm mt-1 mb-6 max-w-md mx-auto">Please try again.</p>
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-blue-800 font-semibold text-sm rounded-full shadow hover:bg-blue-50 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <span>Try Again</span>
                </button>
              </div>
            )}

          </div>
        )}

        {!hasContent && (
          <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-4 scroll-mt-24">
            <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              How it works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { step: "01", title: "Share your trip", body: "Tell us where you want to go, your budget, days, and travel style." },
                { step: "02", title: "AI builds the plan", body: "Amazon Bedrock turns your preferences into a clear day-by-day itinerary." },
                { step: "03", title: "Travel with confidence", body: "Get food picks, practical tips, and a budget breakdown in one place." },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
                >
                  <span className="text-xs font-bold tracking-widest text-blue-600">{item.step}</span>
                  <h4 className="mt-2 font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
