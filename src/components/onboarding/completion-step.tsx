"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

// Easing presets
export type CompletionEasing = "ease-out-expo" | "ease-out-quart" | "ease-out-cubic" | "ease-in-out-quart";

export const COMPLETION_EASING_CURVES: Record<CompletionEasing, [number, number, number, number]> = {
  "ease-out-expo": [0.19, 1, 0.22, 1],
  "ease-out-quart": [0.165, 0.84, 0.44, 1],
  "ease-out-cubic": [0.33, 1, 0.68, 1],
  "ease-in-out-quart": [0.77, 0, 0.175, 1],
};

export interface CompletionAnimationConfig {
  // Logo
  logoSpringStiffness: number;
  logoSpringDamping: number;

  // Content timing
  contentDelay: number;         // Delay before showing content after logo settles (ms)

  // Text animation
  textDuration: number;         // Text fade in duration (ms)
  textSlideDistance: number;    // Text slide up distance (px)
  textBlurAmount: number;       // Text initial blur (px)
  textStagger: number;          // Delay between each word (ms)
  textEasing: CompletionEasing;

  // Button animation
  buttonDelay: number;          // Delay after text starts before button appears (ms)
  buttonDuration: number;       // Button fade in duration (ms)
  buttonSlideDistance: number;  // Button slide up distance (px)
  buttonBlurAmount: number;     // Button initial blur (px)
  buttonEasing: CompletionEasing;
}

export const defaultCompletionConfig: CompletionAnimationConfig = {
  logoSpringStiffness: 200,
  logoSpringDamping: 60,
  contentDelay: 500,
  textDuration: 400,
  textSlideDistance: 12,
  textBlurAmount: 8,
  textStagger: 120,
  textEasing: "ease-out-cubic",
  buttonDelay: 200,
  buttonDuration: 400,
  buttonSlideDistance: 12,
  buttonBlurAmount: 6,
  buttonEasing: "ease-out-cubic",
};

interface CompletionStepProps {
  onComplete: () => void;
  skipAnimation?: boolean;
  animationSpeed?: number;
  animationConfig?: CompletionAnimationConfig;
}

export function CompletionStep({
  onComplete,
  skipAnimation = false,
  animationSpeed = 1,
  animationConfig = defaultCompletionConfig,
}: CompletionStepProps) {
  const { theme } = useTheme();
  const [showContent, setShowContent] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [logoFillColor, setLogoFillColor] = React.useState<string>("var(--fg-subtle)");

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

  // Update logo fill color when dark mode changes (initial gray color)
  React.useEffect(() => {
    setLogoFillColor(isDarkMode ? "var(--fg-muted)" : "var(--fg-subtle)");
  }, [isDarkMode]);

  // Calculate durations based on animation speed
  const config = React.useMemo(() => ({
    logoSpringStiffness: animationConfig.logoSpringStiffness,
    logoSpringDamping: animationConfig.logoSpringDamping,
    contentDelay: animationConfig.contentDelay / animationSpeed,
    textDuration: animationConfig.textDuration / animationSpeed,
    textSlideDistance: animationConfig.textSlideDistance,
    textBlurAmount: animationConfig.textBlurAmount,
    textStagger: animationConfig.textStagger / animationSpeed,
    textEasing: animationConfig.textEasing,
    buttonDelay: animationConfig.buttonDelay / animationSpeed,
    buttonDuration: animationConfig.buttonDuration / animationSpeed,
    buttonSlideDistance: animationConfig.buttonSlideDistance,
    buttonBlurAmount: animationConfig.buttonBlurAmount,
    buttonEasing: animationConfig.buttonEasing,
  }), [animationConfig, animationSpeed]);

  // Split tagline into words for staggered animation
  const taglineWords = "Your library for the internet".split(" ");

  // Skip animation if requested
  React.useEffect(() => {
    if (skipAnimation) {
      onComplete();
      return;
    }
  }, [skipAnimation, onComplete]);

  // Animation sequence
  React.useEffect(() => {
    if (skipAnimation) return;

    // Animate logo color during layout transition (starts immediately)
    // Light mode: gray → black, Dark mode: gray → white
    // The spring animation will handle the smooth transition
    const logoColorTimer = setTimeout(() => {
      setLogoFillColor(isDarkMode ? "var(--fg-inverse)" : "var(--fg)");
    }, 0);

    // Show content after logo settles
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, config.contentDelay);

    return () => {
      clearTimeout(logoColorTimer);
      clearTimeout(contentTimer);
    };
  }, [skipAnimation, config, isDarkMode]);

  const handleBegin = React.useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Get easing curves
  const textEasing = COMPLETION_EASING_CURVES[config.textEasing];
  const buttonEasing = COMPLETION_EASING_CURVES[config.buttonEasing];

  // Button animation delay (after last word starts animating + buttonDelay)
  const buttonDelaySeconds = (((taglineWords.length - 1) * config.textStagger) + config.buttonDelay) / 1000;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-bg">
      {/* Fixed centered container - no layout animations */}
      <div className="flex flex-col items-center text-center">
        {/* Logo with shared layout animation from top */}
        <motion.div
          layoutId="onboarding-logo"
          className="flex items-center justify-center"
          transition={{
            type: "spring",
            stiffness: config.logoSpringStiffness,
            damping: config.logoSpringDamping,
          }}
        >
          <motion.div
            className="h-6 w-auto"
            animate={{
              "--logo-fill": logoFillColor,
            } as any}
            transition={{
              type: "spring",
              stiffness: config.logoSpringStiffness,
              damping: config.logoSpringDamping,
            }}
            style={{
              "--logo-fill": logoFillColor,
            } as React.CSSProperties & { "--logo-fill": string }}
          >
            <Logo
              variant={isDarkMode ? "white" : "neutral-200"}
              className="h-6 w-auto [&_path]:fill-[var(--logo-fill)]"
            />
          </motion.div>
        </motion.div>

        {/* Text and button container - fixed position below logo */}
        <div className="mt-8 flex flex-col items-center gap-6">
          {/* Tagline text - word by word animation */}
          <p className="text-2xl font-medium text-[var(--fg)] tracking-[-0.5px] flex flex-wrap justify-center gap-x-[0.3em]">
            {taglineWords.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: config.textSlideDistance, filter: `blur(${config.textBlurAmount}px)` }}
                animate={showContent ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                transition={{
                  duration: config.textDuration / 1000,
                  delay: (index * config.textStagger) / 1000,
                  ease: textEasing,
                }}
                style={{
                  display: 'inline-block',
                  visibility: showContent ? 'visible' : 'hidden',
                }}
              >
                {word}
              </motion.span>
            ))}
          </p>

          {/* Button with delayed fade + slide + blur */}
          <motion.div
            initial={{ 
              opacity: 0, 
              y: config.buttonSlideDistance,
              filter: `blur(${config.buttonBlurAmount}px)`,
            }}
            animate={showContent ? { 
              opacity: 1, 
              y: 0,
              filter: "blur(0px)",
            } : {
              opacity: 0,
              y: config.buttonSlideDistance,
              filter: `blur(${config.buttonBlurAmount}px)`,
            }}
            transition={{
              opacity: {
                duration: config.buttonDuration / 1000,
                delay: buttonDelaySeconds,
                ease: buttonEasing,
              },
              y: {
                duration: config.buttonDuration / 1000,
                delay: buttonDelaySeconds,
                ease: buttonEasing,
              },
              filter: {
                duration: config.buttonDuration / 1000,
                delay: buttonDelaySeconds,
                ease: buttonEasing,
              },
            }}
            style={{ 
              visibility: showContent ? 'visible' : 'hidden',
            }}
          >
            <Button
              onClick={handleBegin}
              variant="default"
              className="px-8 py-3 rounded-[12px] text-white"
            >
              <span className="font-medium leading-[24px]">
                Let's begin
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
