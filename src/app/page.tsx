"use client";

import { useAuth } from "@/hooks/use-auth";
import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";

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
