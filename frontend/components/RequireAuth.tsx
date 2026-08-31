"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, user } = useAuth();
  const loggedIn = Boolean(getToken() && user);

  useEffect(() => {
    if (!ready) return;
    if (!getToken() || !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !loggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        {ready ? "Redirecting to login..." : "Checking session..."}
      </div>
    );
  }

  return <>{children}</>;
}
