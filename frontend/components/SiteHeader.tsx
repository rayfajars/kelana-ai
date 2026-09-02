import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

export function SiteHeader({
  current,
}: {
  current?: "home" | "trips" | "profile" | "assistant" | "chat";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
            K
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">KelanaAI</p>
            <p className="hidden sm:block text-xs text-slate-500">Plan your next adventure with AI</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <Link
            href="/#plan"
            className={`hidden sm:inline px-3 py-1.5 rounded-lg transition-colors ${
              current === "home" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Plan a Trip
          </Link>
          <Link
            href="/assistant"
            className={`hidden sm:inline px-3 py-1.5 rounded-lg transition-colors ${
              current === "assistant" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Assistant
          </Link>
          <Link
            href="/chat"
            className={`hidden sm:inline px-3 py-1.5 rounded-lg transition-colors ${
              current === "chat" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Chat
          </Link>
          <Link
            href="/trips"
            className={`inline-flex items-center px-3.5 py-2 rounded-xl font-semibold transition-colors ${
              current === "trips"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            My Trips
          </Link>
          <AuthNav current={current} />
        </nav>
      </div>
    </header>
  );
}
