"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconMail, IconArrowLeft } from "@tabler/icons-react";
import { useTheme } from "@/components/theme-provider";

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

// Success screen after magic link sent
function MagicLinkSent({ email, onBack }: { email: string; onBack: () => void }) {
  const { theme } = useTheme();
  
  // Determine if dark mode is effectively active
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);
  
  return (
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container - Matching Figma Design */}
      <div 
        className="rounded-[24px] p-[48px] flex flex-col gap-[24px] items-center w-full max-w-[500px] text-[15px]"
        style={{
          backgroundColor: isDarkMode 
            ? 'color-mix(in oklab, oklch(1 0 0) 20%, oklch(0 0 0) 80%)'
            : 'var(--bg-l2-solid)',
          boxShadow: isDarkMode 
            ? '0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.15), 0 2px 24px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-primary)'
            : '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
          borderWidth: '0px',
        }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-[24px] items-center w-full">
          {/* Email Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-emphasis)]">
            <IconMail className="h-8 w-8 text-[var(--text-primary)]" />
          </div>
          
          <div className="flex flex-col gap-[24px] items-center">
            <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
              Check your email
            </h1>
            <div className="flex flex-col gap-0 items-center">
              <p className="text-[16px] font-medium leading-[32px] text-[var(--text-secondary)] text-center">
                We&apos;ve sent a magic link to
              </p>
              <p className="text-[16px] font-medium leading-[32px] text-[var(--text-primary)] text-center">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-[12px] items-start w-full">
          <Button
            type="button"
            onClick={onBack}
            variant="secondary"
            className="w-full p-3 rounded-[12px] flex items-center gap-2"
          >
            <IconArrowLeft className="h-5 w-5 text-[var(--text-primary)]" />
            <span className="font-medium text-[14px] leading-[24px]">
              Back to sign in
            </span>
          </Button>
        </div>
      </div>
    </div>
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

  // Show success screen when magic link is sent
  if (success) {
    return <MagicLinkSent email={sentToEmail} onBack={handleBackFromSuccess} />;
  }

  return (
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container - Matching Figma Design */}
      <div 
        className="rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px]"
        style={{
          backgroundColor: isDarkMode 
            ? 'color-mix(in oklab, oklch(1 0 0) 20%, oklch(0 0 0) 80%)'
            : 'var(--bg-l2-solid)',
          boxShadow: isDarkMode 
            ? '0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.15), 0 2px 24px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-primary)'
            : '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
          borderWidth: '0px',
        }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-[2px] items-center w-full">
          <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
            Welcome to Cadie
          </h1>
          <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
            Log in or sign up to get started.
          </p>
        </div>

        {/* Auth Options */}
        {!showEmailForm ? (
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
        ) : (
          <div className="flex flex-col gap-[12px] items-start w-full">
            {/* Email Form */}
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
                    className="w-full px-4 py-4 bg-[var(--bg-field-default)] border border-transparent text-[var(--text-primary)] text-[14px] font-medium rounded-[12px] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2783de] placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
                  />
                </div>
                {error && (
                  <p className="text-sm text-[var(--accent-red-primary)]">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="secondary"
                className="w-full p-3 rounded-[12px]"
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
                    <span className="font-medium text-[14px] leading-[24px]">
                      Sending...
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-[14px] leading-[24px]">
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
        )}
        
        {/* Terms & Conditions Text */}
        <p className="font-normal leading-[16px] text-[12px] text-[var(--text-tertiary)] text-center w-[344px]">
          <span>By continuing, you acknowledge that you understand and agree to the </span>
          <Link href="/terms" className="underline text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Terms & Conditions
          </Link>
          <span> and </span>
          <Link href="/privacy" className="underline text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
}
