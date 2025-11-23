"use client";

import { Dashboard } from "@/features/dashboard/components/dashboard";
import { LandingPage } from "@/features/landing/components/landing-page";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, authChecked } = useAuth();

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-neutral-400">Loading...</p>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard user={user} />;
}
