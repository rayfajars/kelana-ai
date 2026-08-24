"use client";

import { useState, FormEvent, useMemo } from "react";

// ──────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────
interface ActivityItem {
  time?: string;
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
function parseActivities(slotText: string): ActivityItem[] {
  if (!slotText) return [];

  // Split by bullet markers (" - " or "\n- " or "\n* " or "\n1. " or " - \d+:\d+")
  // Handle inline hyphens preceding times: " - 8:00 AM - Activity"
  const rawItems = slotText
    .split(/(?:^|\n|\s+-\s+)(?=[A-Za-z0-9"']|\d+:\d+)/)
    .map((s) => s.replace(/^[-*•\d.]\s*/, "").trim())
    .filter((s) => s.length > 2);

  if (rawItems.length === 0 && slotText.trim()) {
    return [{ activity: slotText.trim() }];
  }

  return rawItems.map((item) => {
    // Try to extract time like "8:00 AM", "12:00 PM", "9:30 AM"
    const timeMatch = item.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\s*[-–:]*\s*(.*)/i);
    if (timeMatch) {
      return {
        time: timeMatch[1].trim(),
        activity: timeMatch[2].trim(),
      };
    }
    return { activity: item };
  });
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
    .replace(/\*(.+?)\*/g, '<em class="text-slate-600">$1</em>');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ── Top Header ── */}
      <header className="py-4 px-6 sm:px-10 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
            K
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">KelanaAI</h1>
            <p className="text-xs text-slate-500">Plan your next adventure with AI</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Amazon Bedrock
        </span>
      </header>

      {/* ── Main Split Layout (Left: Form, Right: Rich Output) ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div
          className={`grid gap-8 items-start transition-all duration-300 ${
            hasContent ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-xl mx-auto"
          }`}
        >
          {/* ═══════════ LEFT COLUMN: Travel Form (4 cols) ═══════════ */}
          <div className={hasContent ? "lg:col-span-4" : "w-full"}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 sticky top-24">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Trip Preferences</h2>
                <p className="text-sm text-slate-500 mt-0.5">Customize your destination, budget & style</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Destination */}
                <div>
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {/* 2. Budget */}
                <div>
                  <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">$</span>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="2000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      required
                      min={1}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                </div>

                {/* 3. Days */}
                <div>
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {/* 4. Travel Style */}
                <div>
                  <label htmlFor="travel_style" className="block text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                    Travel Style
                  </label>
                  <select
                    id="travel_style"
                    name="travel_style"
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 cursor-pointer"
                  >
                    <option value="Family">👨‍👩‍👧‍👦 Family</option>
                    <option value="Solo">🎒 Solo</option>
                    <option value="Backpacker">🏕️ Backpacker</option>
                    <option value="Luxury">✨ Luxury</option>
                    <option value="Adventure">🧗 Adventure</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all duration-200 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
          </div>

          {/* ═══════════ RIGHT COLUMN: Rich Output (8 cols) ═══════════ */}
          {hasContent && (
            <div className="lg:col-span-8 space-y-6">
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
                <div className="bg-linear-to-br from-teal-600 via-teal-700 to-emerald-800 rounded-2xl p-12 text-center text-white shadow-lg shadow-teal-700/20 border border-teal-500/30">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mb-4">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Generating itinerary...</h3>
                  <p className="text-teal-100 text-sm mt-1 max-w-md mx-auto">
                    Amazon Bedrock is crafting your daily schedule and recommendations.
                  </p>
                </div>
              )}

              {/* ── Error Handling State ── */}
              {error && !loading && (
                <div className="bg-linear-to-br from-teal-600 to-emerald-800 rounded-2xl p-10 text-center text-white shadow-lg border border-teal-500/30">
                  <div className="text-4xl mb-3">☁️</div>
                  <h3 className="text-xl font-bold">Unable to generate itinerary.</h3>
                  <p className="text-teal-100 text-sm mt-1 mb-6 max-w-md mx-auto">Please try again.</p>
                  <button
                    onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-teal-800 font-semibold text-sm rounded-full shadow hover:bg-teal-50 active:scale-95 transition-all duration-200 cursor-pointer"
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

                      <div className="grid gap-5">
                        {parsed.days.map((dayItem, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
                          >
                            {/* Day Header */}
                            <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
                                Day {dayItem.dayNumber}
                              </span>
                              <h4 className="font-bold text-slate-900 text-base">
                                {dayItem.title}
                              </h4>
                            </div>

                            {/* Time Slots: Morning, Afternoon, Evening */}
                            {dayItem.slots.length > 0 ? (
                              <div className="p-5 grid gap-4 lg:grid-cols-3">
                                {dayItem.slots.map((slot, sIdx) => {
                                  // Theme colors for each slot
                                  const isMorning = slot.label.toLowerCase().includes("morning");
                                  const isAfternoon = slot.label.toLowerCase().includes("afternoon");
                                  const isEvening = slot.label.toLowerCase().includes("evening");

                                  const headerBg = isMorning
                                    ? "bg-amber-50 text-amber-900 border-amber-200"
                                    : isAfternoon
                                    ? "bg-sky-50 text-sky-900 border-sky-200"
                                    : isEvening
                                    ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                                    : "bg-slate-50 text-slate-900 border-slate-200";

                                  const badgeBg = isMorning
                                    ? "bg-amber-100 text-amber-800"
                                    : isAfternoon
                                    ? "bg-sky-100 text-sky-800"
                                    : isEvening
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-200 text-slate-800";

                                  return (
                                    <div
                                      key={sIdx}
                                      className={`rounded-xl border p-4 flex flex-col justify-between ${headerBg}`}
                                    >
                                      <div>
                                        {/* Slot Badge */}
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5">
                                          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                                            <span>{slot.icon}</span> {slot.label}
                                          </div>
                                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${badgeBg}`}>
                                            {slot.activities.length} {slot.activities.length > 1 ? "Activities" : "Activity"}
                                          </span>
                                        </div>

                                        {/* Activity List Items */}
                                        <ul className="space-y-2.5">
                                          {slot.activities.map((act, aIdx) => (
                                            <li
                                              key={aIdx}
                                              className="text-xs text-slate-800 leading-relaxed bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-black/5 shadow-2xs"
                                            >
                                              {act.time && (
                                                <span className="inline-block font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] mr-1.5 mb-1">
                                                  ⏰ {act.time}
                                                </span>
                                              )}
                                              <span
                                                dangerouslySetInnerHTML={{
                                                  __html: formatInline(act.activity),
                                                }}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Fallback if slots not detected */
                              <div
                                className="p-5 text-xs text-slate-700 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: formatInline(dayItem.rawContent || ""),
                                }}
                              />
                            )}
                          </div>
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
                              className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs leading-relaxed text-slate-800 shadow-2xs"
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
                              className="flex items-start gap-2.5 text-xs text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 shadow-2xs"
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
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed shadow-2xs"
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
        </div>
      </main>
    </div>
  );
}
