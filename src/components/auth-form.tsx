"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function AuthForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();

    try {
      // Use NEXT_PUBLIC_SITE_URL if available, otherwise fall back to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) throw error;
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

  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Logo/Icon Section */}
      <div className="flex flex-col items-center space-y-4">
        <Logo className="h-7 mb-8 w-auto text-neutral-50 dark:text-neutral-50" />
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome to Caddy
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Sign in with your email to continue
          </p>
        </div>
      </div>

      {/* Form */}
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
            className="w-full"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Check your email. We&apos;ve sent you a magic link.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full bg-neutral-900 text-white hover:bg-neutral-900/90 border-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 dark:border-neutral-50"
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
              Sending magic link...
            </>
          ) : (
            "Continue with Email"
          )}
        </Button>
      </form>
    </div>
  );
}

