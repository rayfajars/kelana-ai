export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string;
  travel_style: string;
  created_at?: string;
}

export interface GenerateTripInput {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

export interface ActivityItem {
  time?: string;
  title?: string;
  activity: string;
}

export interface TimeSlot {
  label: "Morning" | "Afternoon" | "Evening" | string;
  icon: string;
  activities: ActivityItem[];
  rawText?: string;
}

export interface ParsedDay {
  dayNumber: string;
  title: string;
  slots: TimeSlot[];
  rawContent?: string;
}

export interface ParsedItinerary {
  days: ParsedDay[];
  food: string[];
  tips: string[];
  budgetBreakdown: string[];
}
