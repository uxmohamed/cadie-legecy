"use client";

import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import { OnboardingFlow } from "@/components/onboarding";
import * as React from "react";

export default function Home() {
  const { user, authChecked } = useAuth();
  const { isLoading: onboardingLoading, needsOnboarding, refetch } = useOnboarding(user);

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

  // Show loading while checking onboarding status
  if (onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-l0-solid)]">
        <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
      </div>
    );
  }

  // Show onboarding for new users
  if (needsOnboarding) {
    return <OnboardingFlow user={user} onComplete={refetch} />;
  }

  return <Dashboard user={user} />;
}
