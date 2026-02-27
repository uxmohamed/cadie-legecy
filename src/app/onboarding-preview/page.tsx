"use client";

import { OnboardingFlow, type OnboardingStep } from "@/components/onboarding/onboarding-flow";
import type { User } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import * as React from "react";

const allowedSteps: OnboardingStep[] = [
  "welcome",
  "auth",
  "auth-email",
  "extension",
  "theme",
  "completion",
];

const mockUser: User = {
  id: "preview-user-id",
  app_metadata: {},
  user_metadata: {
    full_name: "Hassan Aboray",
    avatar_url: "",
    email: "hassan@cadie.app",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "hassan@cadie.app",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

function sanitizeStep(step: string | null): OnboardingStep {
  if (!step) return "welcome";
  return allowedSteps.includes(step as OnboardingStep) ? (step as OnboardingStep) : "welcome";
}

export default function OnboardingPreviewPage() {
  const searchParams = useSearchParams();
  const step = React.useMemo(
    () => sanitizeStep(searchParams.get("step")),
    [searchParams]
  );

  return (
    <OnboardingFlow
      user={mockUser}
      forcedStep={step}
      onComplete={() => {}}
    />
  );
}
