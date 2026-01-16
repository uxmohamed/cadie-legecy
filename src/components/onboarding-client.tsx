"use client";

import * as React from "react";
import { OnboardingFlow } from "@/components/onboarding";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface OnboardingClientProps {
  user: User;
}

export function OnboardingClient({ user }: OnboardingClientProps) {
  const router = useRouter();

  const handleComplete = React.useCallback(() => {
    // Navigate to home page to trigger fresh server-side check
    // This clears any stale OAuth flow state from URL hash
    window.location.href = '/';
  }, []);

  return <OnboardingFlow user={user} onComplete={handleComplete} />;
}
