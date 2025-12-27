"use client";

import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import { OnboardingFlow } from "@/components/onboarding";
import { DashboardSkeleton } from "@/components/skeletons";
import * as React from "react";

export default function Home() {
  const { user, authChecked } = useAuth();
  const { isLoading: onboardingLoading, needsOnboarding, refetch } = useOnboarding(user);

  // Show skeleton while checking auth
  if (!authChecked) {
    return <DashboardSkeleton />;
  }

  // Render LandingPage for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show skeleton while checking onboarding status
  if (onboardingLoading) {
    return <DashboardSkeleton />;
  }

  // Show onboarding for new users
  if (needsOnboarding) {
    return <OnboardingFlow user={user} onComplete={refetch} />;
  }

  return <Dashboard user={user} />;
}
