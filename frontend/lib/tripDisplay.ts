export function formatUsd(amount: number): string {
  return `USD ${Number(amount).toLocaleString("en-US")}`;
}

const DESTINATION_VISUALS: { match: string; emoji: string }[] = [
  { match: "japan", emoji: "🇯🇵" },
  { match: "tokyo", emoji: "🇯🇵" },
  { match: "kyoto", emoji: "🇯🇵" },
  { match: "osaka", emoji: "🇯🇵" },
  { match: "jepang", emoji: "🇯🇵" },
  { match: "bali", emoji: "🇮🇩" },
  { match: "bandung", emoji: "🇮🇩" },
  { match: "jakarta", emoji: "🇮🇩" },
  { match: "indonesia", emoji: "🇮🇩" },
  { match: "yogyakarta", emoji: "🇮🇩" },
  { match: "lombok", emoji: "🇮🇩" },
  { match: "singapore", emoji: "🇸🇬" },
  { match: "korea", emoji: "🇰🇷" },
  { match: "seoul", emoji: "🇰🇷" },
  { match: "thailand", emoji: "🇹🇭" },
  { match: "bangkok", emoji: "🇹🇭" },
  { match: "vietnam", emoji: "🇻🇳" },
  { match: "france", emoji: "🇫🇷" },
  { match: "paris", emoji: "🇫🇷" },
  { match: "italy", emoji: "🇮🇹" },
  { match: "rome", emoji: "🇮🇹" },
  { match: "spain", emoji: "🇪🇸" },
  { match: "barcelona", emoji: "🇪🇸" },
  { match: "uk", emoji: "🇬🇧" },
  { match: "london", emoji: "🇬🇧" },
  { match: "usa", emoji: "🇺🇸" },
  { match: "america", emoji: "🇺🇸" },
  { match: "new york", emoji: "🇺🇸" },
  { match: "australia", emoji: "🇦🇺" },
  { match: "malaysia", emoji: "🇲🇾" },
  { match: "philippines", emoji: "🇵🇭" },
  { match: "india", emoji: "🇮🇳" },
  { match: "china", emoji: "🇨🇳" },
  { match: "switzerland", emoji: "🇨🇭" },
  { match: "germany", emoji: "🇩🇪" },
  { match: "netherlands", emoji: "🇳🇱" },
  { match: "uae", emoji: "🇦🇪" },
  { match: "dubai", emoji: "🇦🇪" },
];

const LANDMARKS = ["🗼", "🏯", "🌋", "🏖️", "🕌", "🗽", "🌉", "🏞️"];

export function destinationVisual(destination: string): string {
  const q = destination.toLowerCase();
  const found = DESTINATION_VISUALS.find((item) => q.includes(item.match));
  if (found) return found.emoji;

  const index = Math.abs(
    [...destination].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  );
  return LANDMARKS[index % LANDMARKS.length];
}

export function travelStyleBadgeClass(style: string): string {
  const key = style.toLowerCase();
  if (key.includes("family")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (key.includes("solo")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (key.includes("couple")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (key.includes("backpack")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (key.includes("luxury")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key.includes("adventure")) return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
