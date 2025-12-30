"use client";

import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import { OnboardingFlow } from "@/components/onboarding";
import { DashboardSkeleton } from "@/components/skeletons";
import { useSearchParams } from "next/navigation";
import * as React from "react";

// TEMPORARY: Mock user for development - remove before production
function createMockUser() {
  return {
    id: "dev-user-id",
    email: "dev@example.com",
    user_metadata: {
      full_name: "Dev User",
      name: "Dev User",
    },
  } as any;
}

export default function Home() {
  const searchParams = useSearchParams();
  const devMode = searchParams.get("dev") === "onboarding";
  const { user, authChecked } = useAuth();
  const { isLoading: onboardingLoading, needsOnboarding, refetch } = useOnboarding(user);

  // TEMPORARY: Dev mode - show onboarding flow with mock user
  if (devMode) {
    const mockUser = createMockUser();
    return <OnboardingFlow user={mockUser} onComplete={() => {}} />;
  }

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
