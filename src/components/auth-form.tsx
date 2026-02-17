"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { IconMail, IconArrowLeft } from "@tabler/icons-react";
import { useTheme } from "@/components/theme-provider";
import { motion, AnimatePresence, type Transition } from "framer-motion";

// Animation config matching onboarding flow
const EASING_CURVES = {
  "ease-out-quart": [0.25, 1, 0.5, 1],
  "ease-out-expo": [0.16, 1, 0.3, 1],
} as const;

const animationConfig = {
  fadeDuration: 0.15,
  fadeExitRatio: 0.6,
  layoutDuration: 0.25,
};

// Google Logo SVG Component
function GoogleLogo() {
  return (
    <svg className="size-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="white"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="white"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="white"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="white"
      />
    </svg>
  );
}

export function AuthForm() {
  const { theme } = useTheme();
  const [email, setEmail] = React.useState("");
  const [sentToEmail, setSentToEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  
  // Determine if dark mode is effectively active
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);

  // Memoize transitions matching onboarding flow
  const { layoutTransition, fadeEnterTransition, fadeExitTransition } = React.useMemo(() => {
    const fadeEasing = EASING_CURVES["ease-out-quart"];
    const layoutEasing = EASING_CURVES["ease-out-expo"];

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

  // Determine current view for animation key
  const currentView = success ? "success" : showEmailForm ? "email" : "main";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    try {
      // Multi-environment support: Always use window.location.origin to ensure we use the current domain
      // This ensures that:
      // - Staging users get staging redirect URLs
      // - Production users get production redirect URLs
      // - Works automatically without environment-specific configuration
      const siteUrl = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) throw error;
      setSentToEmail(email);
      setSuccess(true);
      setEmail("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    try {
      // Multi-environment support: Always use window.location.origin to ensure we use the current domain
      // This ensures that:
      // - Staging users get staging redirect URLs
      // - Production users get production redirect URLs
      // - Works automatically without environment-specific configuration
      const siteUrl = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      setGoogleLoading(false);
    }
  }

  function handleBackFromSuccess() {
    setSuccess(false);
    setSentToEmail("");
    setShowEmailForm(false);
  }

  return (
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container with layout animation */}
      <motion.div 
        layout
        className="rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px] overflow-hidden"
        style={{
          backgroundColor: isDarkMode 
            ? 'color-mix(in oklab, oklch(1 0 0) 20%, oklch(0 0 0) 80%)'
            : 'var(--bg-elevated)',
          boxShadow: isDarkMode 
            ? '0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.15), 0 2px 24px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border)'
            : '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
        }}
        transition={layoutTransition}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentView}
            className="flex flex-col gap-[48px] items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: fadeEnterTransition }}
            exit={{ opacity: 0, transition: fadeExitTransition }}
          >
            {success ? (
              <>
                {/* Success Screen */}
                <div className="flex flex-col gap-[24px] items-center w-full">
                  {/* Email Icon */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-emphasis">
                    <IconMail className="h-8 w-8 text-fg" />
                  </div>
                  
                  <div className="flex flex-col gap-[24px] items-center">
                    <h1 className="text-[18px] font-semibold leading-[32px] text-fg text-center">
                      Check your email
                    </h1>
                    <div className="flex flex-col gap-0 items-center">
                      <p className="text-[16px] font-medium leading-[32px] text-fg-muted text-center">
                        We&apos;ve sent a magic link to
                      </p>
                      <p className="text-[16px] font-medium leading-[32px] text-fg text-center">
                        {sentToEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-[12px] items-start w-full">
                  <Button
                    type="button"
                    onClick={handleBackFromSuccess}
                    variant="secondary"
                    className="w-full p-3 rounded-[12px] flex items-center gap-2"
                  >
                    <IconArrowLeft className="h-5 w-5 text-fg" />
                    <span className="font-medium text-[14px] leading-[24px]">
                      Back to sign in
                    </span>
                  </Button>
                </div>
              </>
            ) : !showEmailForm ? (
              <>
                {/* Main Auth Options */}
                <div className="flex flex-col gap-[2px] items-center w-full">
                  <h1 className="text-[18px] font-semibold leading-[32px] text-fg text-center">
                    Welcome to Cadie
                  </h1>
                  <p className="text-[16px] font-medium leading-[32px] text-fg-muted text-center">
                    Log in or sign up to get started.
                  </p>
                </div>

                <div className="flex flex-col gap-[12px] items-start w-full">
                  {/* Google Sign In Button - Primary */}
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    variant="default"
                    className="w-full p-3 rounded-[12px] gap-2 text-white"
                  >
                    {googleLoading ? (
                      <>
                        <svg
                          className="size-6 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="font-medium text-[14px] leading-[24px] text-white">
                          Signing in with Google...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="size-6 flex items-center justify-center">
                          <GoogleLogo />
                        </div>
                        <span className="font-medium text-[14px] leading-[24px] text-white">
                          Continue with Google
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Email Button - Secondary */}
                  <Button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    disabled={googleLoading}
                    variant="secondary"
                    className="w-full p-3 rounded-[12px]"
                  >
                    <span className="font-medium text-[14px] leading-[24px] px-1">
                      Continue with Email
                    </span>
                  </Button>
                </div>
                
                {/* Terms & Conditions Text */}
                <p className="font-normal leading-[16px] text-[12px] text-fg-subtle text-center w-full">
                  <span>By continuing, you acknowledge that you understand and agree to the </span>
                  <Link href="/terms" className="underline text-fg-subtle hover:text-fg transition-colors">
                    Terms & Conditions
                  </Link>
                  <span> and </span>
                  <Link href="/privacy" className="underline text-fg-subtle hover:text-fg transition-colors">
                    Privacy Policy
                  </Link>.
                </p>
              </>
            ) : (
              <>
                {/* Email Form */}
                <div className="flex flex-col gap-[2px] items-center w-full">
                  <h1 className="text-[18px] font-semibold leading-[32px] text-fg text-center">
                    Continue with Email
                  </h1>
                  <p className="text-[16px] font-medium leading-[32px] text-fg-muted text-center">
                    We&apos;ll send you a magic link to sign in.
                  </p>
                </div>

                <div className="flex flex-col gap-[12px] items-start w-full">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-[12px] w-full">
                    <div className="flex flex-col gap-[12px] w-full">
                      <label htmlFor="email" className="sr-only">
                        Email address
                      </label>
                      <div className="w-full">
                        <input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          autoFocus
                          className="w-full px-4 py-4 bg-bg-input border border-transparent text-fg text-[14px] font-medium rounded-[12px] outline-none transition-[border-color,box-shadow,opacity] duration-150 ease-out motion-reduce:transition-none focus:border-transparent focus:ring-2 focus:ring-[#2783de] placeholder:text-fg-subtle disabled:opacity-50"
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-destructive">
                          {error}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="default"
                      className="w-full p-3 rounded-[12px] text-white"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="size-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="font-medium text-[14px] leading-[24px] text-white">
                            Sending...
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-[14px] leading-[24px] text-white">
                          Continue
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Back Button - Ghost */}
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setError("");
                    }}
                    variant="ghost"
                    className="w-full p-3 rounded-[12px]"
                  >
                    <span className="font-medium text-[14px] leading-[24px]">
                      Back to sign in
                    </span>
                  </Button>
                </div>
                
                {/* Terms & Conditions Text */}
                <p className="font-normal leading-[16px] text-[12px] text-fg-subtle text-center w-full">
                  <span>By continuing, you acknowledge that you understand and agree to the </span>
                  <Link href="/terms" className="underline text-fg-subtle hover:text-fg transition-colors">
                    Terms & Conditions
                  </Link>
                  <span> and </span>
                  <Link href="/privacy" className="underline text-fg-subtle hover:text-fg transition-colors">
                    Privacy Policy
                  </Link>.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
