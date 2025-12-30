"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { WelcomeStep } from "./welcome-step";
import { ExtensionStep } from "./extension-step";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

type OnboardingStep = "welcome" | "extension";

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

export function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const router = useRouter();
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

  // TEMPORARY: Development navigation handlers - remove before production
  const handlePrevious = React.useCallback(() => {
    if (currentStep === "extension") {
      setCurrentStep("welcome");
    } else if (currentStep === "welcome") {
      // Navigate back to auth page
      router.push("/auth");
    }
  }, [currentStep, router]);

  const handleNext = React.useCallback(() => {
    if (currentStep === "welcome") {
      // Store profile data if available (for development navigation)
      // In actual flow, this is handled by handleWelcomeComplete
      setCurrentStep("extension");
    }
  }, [currentStep]);

  // Step numbers: Auth = 0, Welcome = 1, Extension = 2
  const currentStepNumber = currentStep === "welcome" ? 1 : 2;
  const isFirstStep = currentStep === "welcome";
  const isLastStep = currentStep === "extension";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-l0-solid)] px-4 py-12">
      {/* Logo at top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
        <Logo variant="neutral-200" className="h-6 w-auto text-[#d4d4d4]" />
      </div>
      
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

      {/* TEMPORARY: Development navigation controls - positioned at bottom - remove before production */}
      <div className="fixed bottom-8 left-0 right-0 z-20 flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm text-[var(--text-tertiary)]">
            Step {currentStepNumber} of 3
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handlePrevious}
              variant="ghost"
              size="sm"
            >
              Previous
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLastStep}
              variant="ghost"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
