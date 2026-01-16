"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AuthEmailStepProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function AuthEmailStep({ onComplete, onBack, isLoading = false }: AuthEmailStepProps) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) throw error;
      // In dev mode, proceed to next step
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          onComplete();
        }, 500);
      }
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

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-[2px] items-center w-full">
        <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
          Continue with Email
        </h1>
        <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
          We&apos;ll send you a magic link to sign in.
        </p>
      </div>

      {/* Email Form */}
      <div className="flex flex-col gap-[12px] items-start w-full">
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-[12px] w-full">
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
                disabled={loading || isLoading}
                autoFocus
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
            disabled={loading || isLoading}
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
          onClick={onBack}
          disabled={loading || isLoading}
          variant="ghost"
          className="w-full p-3 rounded-[12px]"
        >
          <span className="font-medium text-[14px] leading-[24px]">
            Back to sign in
          </span>
        </Button>
      </div>
      
      {/* Terms & Conditions Text */}
      <p className="font-normal leading-[16px] text-[12px] text-[var(--text-tertiary)] text-center w-full">
        <span>By continuing, you acknowledge that you understand and agree to the </span>
        <a href="/terms" className="underline text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          Terms & Conditions
        </a>
        <span> and </span>
        <a href="/privacy" className="underline text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          Privacy Policy
        </a>.
      </p>
    </>
  );
}
