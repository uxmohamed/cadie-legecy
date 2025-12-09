"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { WelcomeStep } from "./welcome-step";
import { ExtensionStep } from "./extension-step";
import { useOnboarding } from "@/hooks/use-onboarding";

type OnboardingStep = "welcome" | "extension";

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

export function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const { complete } = useOnboarding(user);
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>("welcome");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Store profile data between steps
  const [profileData, setProfileData] = React.useState<{
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  const handleWelcomeComplete = React.useCallback((displayName: string, avatarUrl: string) => {
    // Store profile data and move to extension step
    setProfileData({ displayName, avatarUrl });
    setCurrentStep("extension");
  }, []);

  const handleExtensionComplete = React.useCallback(async () => {
    if (!profileData) {
      console.error("No profile data to save!");
      return;
    }
    
    console.log("Saving profile data:", profileData);
    setIsSubmitting(true);
    
    try {
      const success = await complete(profileData.displayName, profileData.avatarUrl);
      console.log("Save result:", success);
      if (success) {
        onComplete();
      } else {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [complete, onComplete, profileData]);

  const handleExtensionSkip = React.useCallback(async () => {
    // Same as complete - save profile and finish
    await handleExtensionComplete();
  }, [handleExtensionComplete]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-l0-solid)] px-4 py-12">
      <div className="relative z-10 flex w-full justify-center">
        {currentStep === "welcome" && (
          <WelcomeStep
            user={user}
            onComplete={handleWelcomeComplete}
            isLoading={false}
          />
        )}
        
        {currentStep === "extension" && (
          <ExtensionStep
            onComplete={handleExtensionComplete}
            onSkip={handleExtensionSkip}
          />
        )}
      </div>
    </div>
  );
}
