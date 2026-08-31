"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/components/AuthProvider";
import { getMe } from "@/services/authService";
import { getToken } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => setError("Unable to load profile."));
  }, [ready, router, setUser]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader current="profile" />
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your account, identified from the JWT — not from the URL.</p>

        {error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : !user ? (
          <p className="mt-6 text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{user.name}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Total trips generated</p>
              <p className="mt-1 text-lg font-bold text-blue-600">{user.trip_count ?? 0}</p>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
