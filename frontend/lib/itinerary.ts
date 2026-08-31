import type { ActivityItem, ParsedDay, ParsedItinerary, TimeSlot } from "@/types/trip";

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

  const titleMatch = remaining.match(/^([^:]{2,40}):\s+(.+)/);
  if (titleMatch) {
    return { time, title: titleMatch[1].trim(), activity: titleMatch[2].trim() };
  }

  return { time, activity: remaining };
}

function splitInlineActivities(text: string): string[] {
  const dashParts = text
    .split(/(?<!(?:\d{1,2}:\d{2}|\d{1,2})\s*(?:AM|PM))\s+[–-]\s+(?=[A-Z"'“]|\d)/i)
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

export function parseMarkdownSections(markdown: string): ParsedItinerary {
  const result: ParsedItinerary = {
    days: [],
    food: [],
    tips: [],
    budgetBreakdown: [],
  };

  if (!markdown) return result;

  const sections = markdown.split(/^##\s+/gm);

  for (const sec of sections) {
    if (!sec.trim()) continue;

    const firstLineEnd = sec.indexOf("\n");
    const heading = firstLineEnd === -1 ? sec.trim() : sec.slice(0, firstLineEnd).trim();
    const body = firstLineEnd === -1 ? "" : sec.slice(firstLineEnd).trim();
    const lowerHeading = heading.toLowerCase();

    if (lowerHeading.includes("itinerary") || lowerHeading.includes("daily")) {
      const dayBlocks = body.split(/(?:^|\n)(?=###?\s*Day\s*\d+|Day\s*\d+[:\s-])/i);

      for (const block of dayBlocks) {
        if (!block.trim()) continue;

        const titleMatch = block.match(/(?:###?\s*)?Day\s*(\d+)[:\s-]*(.*?)(?=\n|Morning|$)/i);
        const dayNumber = titleMatch ? titleMatch[1] : `${result.days.length + 1}`;
        const dayTitle =
          titleMatch && titleMatch[2]
            ? titleMatch[2].replace(/^[:\s-]+/, "").trim()
            : `Day ${dayNumber}`;

        const morningMatch = block.match(
          /(?:\*\*Morning\*\*|Morning)[:\s]*([\s\S]*?)(?=(?:\*\*Afternoon\*\*|Afternoon)[:\s]|(?:\*\*Evening\*\*|Evening)[:\s]|$)/i
        );
        const afternoonMatch = block.match(
          /(?:\*\*Afternoon\*\*|Afternoon)[:\s]*([\s\S]*?)(?=(?:\*\*Evening\*\*|Evening)[:\s]|$)/i
        );
        const eveningMatch = block.match(
          /(?:\*\*Evening\*\*|Evening)[:\s]*([\s\S]*?)(?=(?:###?\s*Day|##|$))/i
        );

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

        const day: ParsedDay = {
          dayNumber,
          title: dayTitle || "Exploration & Highlights",
          slots,
          rawContent: block,
        };
        result.days.push(day);
      }
    } else if (
      lowerHeading.includes("food") ||
      lowerHeading.includes("culinary") ||
      lowerHeading.includes("kuliner") ||
      lowerHeading.includes("makan")
    ) {
      result.food.push(
        ...body
          .split(/\n+/)
          .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
          .filter((l) => l.length > 0)
      );
    } else if (
      lowerHeading.includes("tip") ||
      lowerHeading.includes("saran") ||
      lowerHeading.includes("advice")
    ) {
      result.tips.push(
        ...body
          .split(/\n+/)
          .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
          .filter((l) => l.length > 0)
      );
    } else if (
      lowerHeading.includes("budget") ||
      lowerHeading.includes("biaya") ||
      lowerHeading.includes("breakdown")
    ) {
      result.budgetBreakdown.push(
        ...body
          .split(/\n+/)
          .map((l) => l.replace(/^[-*•\d.]\s*/, "").trim())
          .filter((l) => l.length > 0)
      );
    }
  }

  return result;
}

export function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-500">$1</em>');
}

export function extractCostNote(text: string): { text: string; cost?: string } {
  const costMatch = text.match(
    /\(?\s*((?:approx\.?\s*)?(?:cost[:\s]+)?USD\s*[\d,]+(?:\s*per\s*[^).]+)?)\)?\.?\s*$/i
  );
  if (!costMatch || costMatch.index === undefined) return { text };

  const cost = costMatch[1].replace(/^cost[:\s]+/i, "").trim();
  const main = text.slice(0, costMatch.index).replace(/[\s(]+$/, "").trim();
  return { text: main || text, cost };
}

export function getSlotTheme(label: string) {
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

export function categoryBadgeClass(category: string): string {
  const key = category.toLowerCase();
  if (key.includes("luxury")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key.includes("backpack")) return "bg-orange-50 text-orange-700 border-orange-200";
  if (key.includes("standard")) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
