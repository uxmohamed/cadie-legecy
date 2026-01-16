"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { motion, AnimatePresence, LayoutGroup, type Transition } from "framer-motion";
import { AuthStep } from "./auth-step";
import { AuthEmailStep } from "./auth-email-step";
import { WelcomeStep } from "./welcome-step";
import { ExtensionStep } from "./extension-step";
import { ThemeStep } from "./theme-step";
import { CompletionStep, defaultCompletionConfig } from "./completion-step";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";

export type OnboardingStep = "auth" | "auth-email" | "welcome" | "extension" | "theme" | "completion";

// Easing curves
const EASING_CURVES = {
  "ease-out-quart": [0.25, 1, 0.5, 1],
  "ease-out-expo": [0.16, 1, 0.3, 1],
} as const;

// Animation config
const animationConfig = {
  fadeDuration: 0.15,
  fadeExitRatio: 0.6,
  layoutDuration: 0.25,
  fadeEasing: "ease-out-quart" as keyof typeof EASING_CURVES,
  layoutEasing: "ease-out-expo" as keyof typeof EASING_CURVES,
};

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

export function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const { complete } = useOnboarding(user);
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>("welcome");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Wait for mount to avoid hydration mismatch with window.matchMedia
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is effectively active (only after mount for system theme)
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && mounted) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme, mounted]);

  // Memoize transitions
  const { layoutTransition, fadeEnterTransition, fadeExitTransition } = React.useMemo(() => {
    const fadeEasing = EASING_CURVES[animationConfig.fadeEasing];
    const layoutEasing = EASING_CURVES[animationConfig.layoutEasing];

    return {
      layoutTransition: {
        layout: {
          duration: animationConfig.layoutDuration,
          ease: layoutEasing,
        },
      } as Transition,
      fadeEnterTransition: {
        duration: animationConfig.fadeDuration,
        ease: fadeEasing,
      } as Transition,
      fadeExitTransition: {
        duration: animationConfig.fadeDuration * animationConfig.fadeExitRatio,
        ease: fadeEasing,
      } as Transition,
    };
  }, []);
  
  // Store profile data between steps
  const [profileData, setProfileData] = React.useState<{
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  const handleAuthComplete = React.useCallback(() => {
    setCurrentStep("welcome");
  }, []);

  const handleAuthEmailClick = React.useCallback(() => {
    setCurrentStep("auth-email");
  }, []);

  const handleAuthEmailBack = React.useCallback(() => {
    setCurrentStep("auth");
  }, []);

  const handleAuthEmailComplete = React.useCallback(() => {
    setCurrentStep("welcome");
  }, []);

  const handleWelcomeComplete = React.useCallback(async (displayName: string, avatarUrl: string) => {
    setProfileData({ displayName, avatarUrl });
    setCurrentStep("extension");
  }, []);

  const handleExtensionComplete = React.useCallback(async () => {
    setCurrentStep("theme");
  }, []);

  const handleExtensionSkip = React.useCallback(async () => {
    setCurrentStep("theme");
  }, []);

  const handleThemeComplete = React.useCallback(() => {
    setCurrentStep("completion");
  }, []);

  const handleCompletionComplete = React.useCallback(async () => {
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
        onComplete();
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [complete, onComplete, profileData, user]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-l0-solid)] px-4 py-12 pb-32">
      {/* LayoutGroup for logo shared layout animation */}
      <LayoutGroup>
        {/* Logo at top - animates to center during completion */}
        {currentStep !== "completion" && (
          <div className="absolute top-8 left-0 right-0 z-10 flex flex-col items-center gap-2">
            <motion.div
              layoutId="onboarding-logo"
              className="flex items-center justify-center"
            >
              <Logo 
                variant={isDarkMode ? "white" : "neutral-200"} 
                className="h-6 w-auto [&_path]:fill-[var(--text-tertiary)] dark:[&_path]:fill-[var(--text-secondary)]" 
              />
            </motion.div>
          </div>
        )}

        {/* Completion Animation - logo animates here */}
        {currentStep === "completion" && (
          <CompletionStep
            onComplete={handleCompletionComplete}
            skipAnimation={false}
            animationSpeed={1}
            animationConfig={defaultCompletionConfig}
          />
        )}
      </LayoutGroup>

      {/* Card container - only this has layout for height animation */}
      {currentStep !== "completion" && (
        <div className="relative z-10 flex w-full max-w-[450px] justify-center">
          <motion.div
            layout
            className="rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px] overflow-hidden"
            style={{
              backgroundColor: isDarkMode
                ? 'color-mix(in oklab, oklch(1 0 0) 20%, oklch(0 0 0) 80%)'
                : 'var(--bg-l2-solid)',
              boxShadow: isDarkMode
                ? '0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.15), 0 2px 24px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-primary)'
                : '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
            }}
            transition={layoutTransition}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentStep}
                className="flex flex-col gap-[48px] items-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: fadeEnterTransition }}
                exit={{ opacity: 0, transition: fadeExitTransition }}
              >
                {currentStep === "auth" && (
                  <AuthStep
                    onComplete={handleAuthComplete}
                    onEmailClick={handleAuthEmailClick}
                    isLoading={isSubmitting}
                  />
                )}

                {currentStep === "auth-email" && (
                  <AuthEmailStep
                    onComplete={handleAuthEmailComplete}
                    onBack={handleAuthEmailBack}
                    isLoading={isSubmitting}
                  />
                )}

                {currentStep === "welcome" && (
                  <WelcomeStep
                    user={user}
                    onComplete={handleWelcomeComplete}
                    isLoading={isSubmitting}
                  />
                )}

                {currentStep === "extension" && (
                  <ExtensionStep
                    onComplete={handleExtensionComplete}
                    onSkip={handleExtensionSkip}
                    onInstallClick={() => {}}
                    isLoading={false}
                    isDarkMode={isDarkMode}
                  />
                )}

                {currentStep === "theme" && (
                  <ThemeStep
                    onComplete={handleThemeComplete}
                    isLoading={isSubmitting}
                    isDarkMode={isDarkMode}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}
