import {
  extractCostNote,
  formatInline,
  getSlotTheme,
  parseMarkdownSections,
} from "@/lib/itinerary";

export function ItineraryView({ recommendation }: { recommendation: string }) {
  const parsed = parseMarkdownSections(recommendation || "");

  if (
    parsed.days.length === 0 &&
    parsed.food.length === 0 &&
    parsed.tips.length === 0 &&
    parsed.budgetBreakdown.length === 0
  ) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
        {recommendation || "No itinerary details yet."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 sm:grid-cols-2">
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
  );
}
