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
    // Refresh the page to re-check onboarding status
    router.refresh();
  }, [router]);

  return <OnboardingFlow user={user} onComplete={handleComplete} />;
}
