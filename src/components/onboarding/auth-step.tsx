"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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

interface AuthStepProps {
  onComplete: () => void;
  onEmailClick: () => void;
  isLoading?: boolean;
}

export function AuthStep({ onComplete, onEmailClick, isLoading = false }: AuthStepProps) {
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");

    const supabase = createClient();

    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
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
      setGoogleLoading(false);
    }
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-[2px] items-center w-full">
        <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
          Welcome to Cadie
        </h1>
        <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
          Log in or sign up to get started.
        </p>
      </div>

      {/* Auth Buttons */}
      <div className="flex flex-col gap-[12px] items-start w-full">
        {/* Google Sign In Button - Primary */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || isLoading}
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

        {error && (
          <p className="text-sm text-[var(--accent-red-primary)] w-full text-center">
            {error}
          </p>
        )}

        {/* Email Button - Secondary */}
        <Button
          type="button"
          onClick={onEmailClick}
          disabled={googleLoading || isLoading}
          variant="secondary"
          className="w-full p-3 rounded-[12px]"
        >
          <span className="font-medium text-[14px] leading-[24px] px-1">
            Continue with Email
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
