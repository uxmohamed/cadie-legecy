"use client";

import { useAuth } from "@/hooks/use-auth";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, authChecked } = useAuth();
  const router = useRouter();

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-l0-solid)">
        <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Render LandingPage for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard user={user} />;
}
