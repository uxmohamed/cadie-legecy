"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { IconMail } from "@tabler/icons-react";

// Google Logo SVG Component
function GoogleLogo() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Success screen after magic link sent
function MagicLinkSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Logo/Icon Section */}
      <div className="flex flex-col items-center space-y-6">
        <Logo variant="neutral-200" className="h-7 mb-4 w-auto" />
        
        {/* Email Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-emphasis)]">
          <IconMail className="h-8 w-8 text-[var(--text-primary)]" />
        </div>
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Check your email
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            We&apos;ve sent a magic link to
          </p>
          <p className="text-base font-medium text-[var(--text-primary)]">
            {email}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-tertiary)] text-center">
          Click the link in your email to sign in. If you don&apos;t see it, check your spam folder.
        </p>
        
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          size="xl"
          className="w-full"
        >
          ← Back to sign in
        </Button>
      </div>
    </div>
  );
}

export function AuthForm() {
  const [email, setEmail] = React.useState("");
  const [sentToEmail, setSentToEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showEmailForm, setShowEmailForm] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    try {
      // Use NEXT_PUBLIC_SITE_URL if available and not localhost, otherwise fall back to window.location.origin
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl || siteUrl.includes('localhost')) {
        siteUrl = window.location.origin;
      }
      
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
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl || siteUrl.includes('localhost')) {
        siteUrl = window.location.origin;
      }

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
    <div className="w-full max-w-[400px] space-y-8">
      {/* Logo/Icon Section */}
      <div className="flex flex-col items-center space-y-4">
        <Logo variant="neutral-200" className="h-7 mb-8 w-auto" />
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome to Caddy
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Log in or sign up to get started.
          </p>
        </div>
      </div>

      {/* Auth Options */}
      {!showEmailForm ? (
        <div className="space-y-3">
          {/* Google Sign In Button - Primary */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            variant="secondary"
            size="xl"
            className="w-full"
          >
            {googleLoading ? (
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
                Signing in with Google...
              </>
            ) : (
              <>
                <GoogleLogo />
                Continue with Google
              </>
            )}
          </Button>

          {/* Email Button - Ghost */}
          <Button
            type="button"
            onClick={() => setShowEmailForm(true)}
            disabled={googleLoading}
            variant="ghost"
            size="xl"
            className="w-full"
          >
            Continue with Email
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                size="lg"
                className="w-full px-4 py-3 bg-[var(--bg-field-default)] border-[var(--border-primary)] text-[var(--text-primary)] text-base rounded-xl shadow-none focus:border-[var(--border-active)] placeholder:text-[var(--text-tertiary)]"
              />
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
              size="xl"
              className="w-full"
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
                  Sending...
                </>
              ) : (
                "Continue"
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
            size="xl"
            className="w-full"
          >
            Back to sign in
          </Button>
        </div>
      )}
    </div>
  );
}
