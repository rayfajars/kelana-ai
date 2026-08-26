"use client";

import { useState, FormEvent, useMemo } from "react";
import Image from "next/image";

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────
interface ActivityItem {
  time?: string;
  title?: string;
  activity: string;
}

interface TimeSlot {
  label: "Morning" | "Afternoon" | "Evening" | string;
  icon: string;
  activities: ActivityItem[];
  rawText?: string;
}

interface ParsedDay {
  dayNumber: string;
  title: string;
  slots: TimeSlot[];
  rawContent?: string;
}

interface ParsedItinerary {
  days: ParsedDay[];
  food: string[];
  tips: string[];
  budgetBreakdown: string[];
}

interface TripResponse {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string;
  travel_style: string;
}

// ──────────────────────────────────────────────
// Helper: Parse Sub-Activities from a Time Slot text
// e.g. "- 8:00 AM - Breakfast at..." or "1. 9:00 AM..."
// ──────────────────────────────────────────────
function cleanActivityLine(line: string): string {
  return line
    .replace(/^[-*•]+\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function toActivityItem(item: string): ActivityItem {
  let remaining = item.trim();
  let time: string | undefined;

  const timeMatch = remaining.match(
    /^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\s*[-–:]*\s*(.*)/i
  );
  if (timeMatch) {
    time = timeMatch[1].trim();
    remaining = timeMatch[2].trim();
  }

  // "Lunch: Try local street food" → title + detail
  const titleMatch = remaining.match(/^([^:]{2,40}):\s+(.+)/);
  if (titleMatch) {
    return { time, title: titleMatch[1].trim(), activity: titleMatch[2].trim() };
  }

  return { time, activity: remaining };
}

function splitInlineActivities(text: string): string[] {
  const dashParts = text
    .split(
      /(?<!(?:\d{1,2}:\d{2}|\d{1,2})\s*(?:AM|PM))\s+[–-]\s+(?=[A-Z"'“]|\d)/i
    )
    .map(cleanActivityLine)
    .filter((s) => s.length > 2);

  if (dashParts.length > 1) return dashParts;

  const keywordParts = text
    .split(
      /(?<=[.!?])\s+(?=(?:Visit|Explore|Head|Go|Enjoy|Try|Have|Arrive|Arrival|Transfer|Lunch|Dinner|Breakfast|Overnight|Check[- ]?in|Then\b|[A-Z][a-z][^.]{0,40}:))/
    )
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (keywordParts.length > 1) return keywordParts;

  const sentences = text
    .split(/(?<!\bApprox)(?<=[.!?])\s+(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (sentences.length > 1) return sentences;

  return [text.trim()].filter((s) => s.length > 2);
}

function parseActivities(slotText: string): ActivityItem[] {
  if (!slotText) return [];

  const text = slotText.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map(cleanActivityLine)
    .filter((l) => l.length > 2 && !/^(morning|afternoon|evening)$/i.test(l));

  const items = (lines.length > 0 ? lines : [text]).flatMap(splitInlineActivities);

  if (items.length === 0) {
    return [{ activity: text }];
  }

  return items.map(toActivityItem);
}

// ──────────────────────────────────────────────
// Robust Markdown Parser
// ──────────────────────────────────────────────
function parseMarkdownSections(markdown: string): ParsedItinerary {
  const result: ParsedItinerary = {
    days: [],
    food: [],
    tips: [],
    budgetBreakdown: [],
  };

  if (!markdown) return result;

  // Split by H2 headers (## Header) or double newlines
  const sections = markdown.split(/^##\s+/gm);

  for (const sec of sections) {
    if (!sec.trim()) continue;

    const firstLineEnd = sec.indexOf("\n");
    const heading = firstLineEnd === -1 ? sec.trim() : sec.slice(0, firstLineEnd).trim();
    const body = firstLineEnd === -1 ? "" : sec.slice(firstLineEnd).trim();
    const lowerHeading = heading.toLowerCase();

    if (lowerHeading.includes("itinerary") || lowerHeading.includes("daily")) {
      // Split into days by (### Day X or Day X:)
      const dayBlocks = body.split(/(?:^|\n)(?=###?\s*Day\s*\d+|Day\s*\d+[:\s-])/i);

      for (const block of dayBlocks) {
        if (!block.trim()) continue;

        // Match Day Number and Title
        const titleMatch = block.match(/(?:###?\s*)?Day\s*(\d+)[:\s-]*(.*?)(?=\n|Morning|$)/i);
        const dayNumber = titleMatch ? titleMatch[1] : `${result.days.length + 1}`;
        const dayTitle = titleMatch && titleMatch[2] ? titleMatch[2].replace(/^[:\s-]+/, "").trim() : `Day ${dayNumber}`;

        // Flexible Extraction of Morning, Afternoon, Evening (even if inlined)
        // Look for Morning: ... Afternoon: ... Evening: ...
        const morningMatch = block.match(/(?:\*\*Morning\*\*|Morning)[:\s]*([\s\S]*?)(?=(?:\*\*Afternoon\*\*|Afternoon)[:\s]|(?:\*\*Evening\*\*|Evening)[:\s]|$)/i);
        const afternoonMatch = block.match(/(?:\*\*Afternoon\*\*|Afternoon)[:\s]*([\s\S]*?)(?=(?:\*\*Evening\*\*|Evening)[:\s]|$)/i);
        const eveningMatch = block.match(/(?:\*\*Evening\*\*|Evening)[:\s]*([\s\S]*?)(?=(?:###?\s*Day|##|$))/i);

        const morningText = morningMatch ? morningMatch[1].trim() : "";
        const afternoonText = afternoonMatch ? afternoonMatch[1].trim() : "";
        const eveningText = eveningMatch ? eveningMatch[1].trim() : "";

        const slots: TimeSlot[] = [];

        if (morningText) {
          slots.push({
            label: "Morning",
            icon: "🌅",
            activities: parseActivities(morningText),
            rawText: morningText,
          });
        }
        if (afternoonText) {
          slots.push({
            label: "Afternoon",
            icon: "☀️",
            activities: parseActivities(afternoonText),
            rawText: afternoonText,
          });
        }
        if (eveningText) {
          slots.push({
            label: "Evening",
            icon: "🌙",
            activities: parseActivities(eveningText),
            rawText: eveningText,
          });
        }

        result.days.push({
          dayNumber,
          title: dayTitle || `Exploration & Highlights`,
          slots,
          rawContent: block,
        });
      }
    } else if (lowerHeading.includes("food") || lowerHeading.includes("culinary") || lowerHeading.includes("kuliner") || lowerHeading.includes("makan")) {
      const items = body
        .split(/\n+/)
        .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
        .filter((l) => l.length > 0);
      result.food.push(...items);
    } else if (lowerHeading.includes("tip") || lowerHeading.includes("saran") || lowerHeading.includes("advice")) {
      const items = body
        .split(/\n+/)
        .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
        .filter((l) => l.length > 0);
      result.tips.push(...items);
    } else if (lowerHeading.includes("budget") || lowerHeading.includes("biaya") || lowerHeading.includes("breakdown")) {
      const items = body
        .split(/\n+/)
        .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
        .filter((l) => l.length > 0);
      result.budgetBreakdown.push(...items);
    }
  }

  return result;
}

// Simple inline styling (bold & italic)
function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-500">$1</em>');
}

function extractCostNote(text: string): { text: string; cost?: string } {
  const costMatch = text.match(
    /\(?\s*((?:approx\.?\s*)?(?:cost[:\s]+)?USD\s*[\d,]+(?:\s*per\s*[^).]+)?)\)?\.?\s*$/i
  );
  if (!costMatch || costMatch.index === undefined) return { text };

  const cost = costMatch[1].replace(/^cost[:\s]+/i, "").trim();
  const main = text.slice(0, costMatch.index).replace(/[\s(]+$/, "").trim();
  return { text: main || text, cost };
}

function getSlotTheme(label: string) {
  const key = label.toLowerCase();
  if (key.includes("morning")) {
    return {
      dot: "bg-sky-500",
      badge: "bg-sky-50 text-sky-700 ring-sky-100",
      label: "text-sky-700",
    };
  }
  if (key.includes("afternoon")) {
    return {
      dot: "bg-blue-600",
      badge: "bg-blue-50 text-blue-700 ring-blue-100",
      label: "text-blue-700",
    };
  }
  if (key.includes("evening")) {
    return {
      dot: "bg-indigo-600",
      badge: "bg-indigo-50 text-indigo-700 ring-indigo-100",
      label: "text-indigo-700",
    };
  }
  return {
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    label: "text-slate-700",
  };
}

// ──────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────
export default function Home() {
  // Form State
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [travelStyle, setTravelStyle] = useState("Family");

  // Submitted snapshot
  const [submittedMeta, setSubmittedMeta] = useState<{
    destination: string;
    budget: string;
    days: string;
    travelStyle: string;
  } | null>(null);

  // API Call States
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse markdown into rich structured visual sections
  const parsed = useMemo(() => {
    return parseMarkdownSections(trip?.ai_recommendation || "");
  }, [trip?.ai_recommendation]);

  // ── Calling FastAPI Backend ──
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTrip(null);

    const snapshot = { destination, budget, days, travelStyle };
    setSubmittedMeta(snapshot);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: snapshot.destination,
          budget: Number(snapshot.budget),
          days: Number(snapshot.days),
          travel_style: snapshot.travelStyle,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data: TripResponse = await response.json();
      setTrip(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate itinerary. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const hasContent = loading || error || trip;
  const heroTitle = submittedMeta?.destination || destination.trim() || "Discover your next destination";
  const fieldClass =
    "w-full min-h-12 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <a href="#plan" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              K
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">KelanaAI</h1>
              <p className="hidden sm:block text-xs text-slate-500">Plan your next adventure with AI</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#plan" className="hover:text-blue-600 transition-colors">Plan a Trip</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#footer" className="hover:text-blue-600 transition-colors">About</a>
          </nav>

          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="hidden sm:inline">Amazon </span>Bedrock
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Destination Hero ── */}
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

          {/* Search form overlaps the hero; stacks on mobile, aligns in a row on desktop */}
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

        {/* ── Rich Output ── */}
        {hasContent && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4 space-y-6">
              {/* Trip Overview Bar */}
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
                      <span className="font-bold text-blue-600 text-base">USD {Number(submittedMeta.budget).toLocaleString()}</span>
                    </div>
                    {trip?.category && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {trip.category}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Loading Spinner State (Tailwind animate-spin) ── */}
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

              {/* ── Core Challenge: Richer Visual Output ── */}
              {trip && !loading && !error && (
                <div className="space-y-6">
                  {/* 1. Daily Itinerary Section (Visual Cards with Clear Morning, Afternoon, Evening Timelines) */}
                  {parsed.days.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <span>📅</span> Daily Itinerary ({parsed.days.length} Days)
                      </h3>

                      <div className="grid gap-6">
                        {parsed.days.map((dayItem, idx) => (
                          <article
                            key={idx}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                          >
                            <header className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-blue-600 text-white">
                                Day {dayItem.dayNumber}
                              </span>
                              <h4 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                                {dayItem.title}
                              </h4>
                            </header>

                            {dayItem.slots.length > 0 ? (
                              <div className="px-5 sm:px-6 py-5">
                                <div className="flex flex-col">
                                  {dayItem.slots.map((slot, sIdx) => {
                                    const theme = getSlotTheme(slot.label);
                                    const isLast = sIdx === dayItem.slots.length - 1;

                                    return (
                                      <div key={sIdx} className="flex gap-4">
                                        <div className="flex w-3 shrink-0 flex-col items-center pt-1.5">
                                          <span className={`h-3 w-3 rounded-full ring-4 ring-white ${theme.dot}`} />
                                          {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                                        </div>

                                        <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                                          <div className="flex items-center justify-between gap-3 mb-3">
                                            <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${theme.label}`}>
                                              {slot.icon} {slot.label}
                                            </span>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>
                                              {slot.activities.length} {slot.activities.length > 1 ? "activities" : "activity"}
                                            </span>
                                          </div>

                                          <ul className="flex flex-col gap-2.5">
                                            {slot.activities.map((act, aIdx) => {
                                              const parsedAct = extractCostNote(act.activity);

                                              return (
                                                <li
                                                  key={aIdx}
                                                  className="bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 transition-colors"
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <span
                                                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ring-inset ${theme.badge}`}
                                                    >
                                                      {aIdx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                      {act.time && (
                                                        <span className="inline-block font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md text-[11px] mb-1.5">
                                                          {act.time}
                                                        </span>
                                                      )}
                                                      {act.title && (
                                                        <p className="font-semibold text-sm text-slate-900 leading-snug">
                                                          {act.title}
                                                        </p>
                                                      )}
                                                      <p
                                                        className={`text-sm leading-relaxed ${
                                                          act.title ? "mt-1 text-slate-500" : "text-slate-700"
                                                        }`}
                                                        dangerouslySetInnerHTML={{
                                                          __html: formatInline(parsedAct.text),
                                                        }}
                                                      />
                                                      {parsedAct.cost && (
                                                        <p className="mt-1.5 text-xs font-medium text-slate-400">
                                                          {parsedAct.cost}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div
                                className="p-5 text-sm text-slate-600 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: formatInline(dayItem.rawContent || ""),
                                }}
                              />
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 2 & 3. Local Food & Travel Tips Section */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Local Food Recommendations */}
                    {parsed.food.length > 0 && (
                      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                          <span>🍜</span> Local Food Recommendations
                        </h3>
                        <div className="space-y-3">
                          {parsed.food.map((dish, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-700"
                              dangerouslySetInnerHTML={{ __html: formatInline(dish) }}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Travel Tips */}
                    {parsed.tips.length > 0 && (
                      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                          <span>💡</span> Travel Tips
                        </h3>
                        <ul className="space-y-3">
                          {parsed.tips.map((tipItem, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100"
                            >
                              <span className="text-blue-600 font-bold mt-0.5">✓</span>
                              <span
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: formatInline(tipItem) }}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>

                  {/* 4. Estimated Budget Breakdown */}
                  {parsed.budgetBreakdown.length > 0 && (
                    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <span>💰</span> Estimated Budget Breakdown
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {parsed.budgetBreakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatInline(item) }}
                          />
                        ))}
                      </div>
                    </section>
                  )}
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

      <footer id="footer" className="mt-12 sm:mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-800">KelanaAI</p>
            <p className="text-sm text-slate-500 mt-0.5">
              © {new Date().getFullYear()} KelanaAI. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <a href="#plan" className="hover:text-blue-600 transition-colors">Plan a Trip</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#footer" className="hover:text-blue-600 transition-colors">About</a>
            <a href="mailto:hello@kelana.ai" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
