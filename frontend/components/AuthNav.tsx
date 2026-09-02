"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AuthNav({
  current,
}: {
  current?: "home" | "trips" | "profile" | "assistant" | "chat";
}) {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
        <Link
          href="/login"
          className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Register
        </Link>
      </div>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
      <Link
        href="/profile"
        title="Profile"
        className={`inline-flex items-center gap-2 rounded-xl py-1 pl-1 pr-2.5 transition-colors ${
          current === "profile"
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            current === "profile" ? "bg-white/15 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {initial}
        </span>
        <span className="hidden sm:block max-w-28 truncate text-sm font-semibold">
          {user.name}
        </span>
      </Link>
      <button
        type="button"
        onClick={logout}
        className="px-2 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
