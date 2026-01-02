"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { WelcomeStep } from "./welcome-step";
import { ExtensionStep } from "./extension-step";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Logo } from "@/components/logo";
import { trackOnboardingStarted, trackOnboardingStepCompleted, trackOnboardingCompleted } from "@/lib/posthog-client";

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

  // Track onboarding start
  React.useEffect(() => {
    trackOnboardingStarted();
  }, []);

  const handleWelcomeComplete = React.useCallback(async (displayName: string, avatarUrl: string) => {
    // Skip extension step for now (extension not ready for release)
    // Complete onboarding directly after welcome step
    setIsSubmitting(true);
    
    try {
      const success = await complete(displayName, avatarUrl);
        if (success) {
          trackOnboardingStepCompleted('welcome');
          trackOnboardingCompleted();
          onComplete();
        }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [complete, onComplete]);

  const handleExtensionComplete = React.useCallback(async () => {
    if (!profileData) {
      // If no profile data, try to get initial values from user
      const initialName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
      const initialAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
      
      setIsSubmitting(true);
      try {
        const success = await complete(initialName, initialAvatar);
        if (success) {
          onComplete();
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await complete(profileData.displayName, profileData.avatarUrl);
      if (success) {
        trackOnboardingStepCompleted('extension');
        trackOnboardingCompleted();
        onComplete();
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [complete, onComplete, profileData, user]);

  const handleExtensionSkip = React.useCallback(async () => {
    // Same as complete - save profile and finish
    await handleExtensionComplete();
  }, [handleExtensionComplete]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-l0-solid)] px-4 py-12">
      {/* Logo at top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
        <Logo variant="neutral-200" className="h-6 w-auto text-[var(--text-tertiary)]" />
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
    </div>
  );
}
