"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function AuthNav({ current }: { current?: "home" | "trips" | "profile" | "assistant" }) {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
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

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <p className="hidden sm:block text-sm text-slate-600 truncate max-w-48">
        Welcome back, {user.name} 👋
      </p>
      <Link
        href="/profile"
        className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
          current === "profile"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:text-blue-600"
        }`}
      >
        {user.name}
      </Link>
      <button
        type="button"
        onClick={logout}
        className="text-sm font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
