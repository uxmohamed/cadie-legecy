"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { AvatarPicker } from "./avatar-picker";
import { getInitialAvatar, getInitialDisplayName } from "@/hooks/use-onboarding";

interface WelcomeStepProps {
  user: User;
  onComplete: (displayName: string, avatarUrl: string) => void;
  isLoading?: boolean;
}

export function WelcomeStep({ user, onComplete, isLoading = false }: WelcomeStepProps) {
  const initialAvatar = React.useMemo(() => getInitialAvatar(user), [user]);
  const initialName = React.useMemo(() => getInitialDisplayName(user), [user]);
  
  const [displayName, setDisplayName] = React.useState(initialName);
  const [avatarUrl, setAvatarUrl] = React.useState(initialAvatar);
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate name is required
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    onComplete(trimmedName, avatarUrl);
  };

  const userInitial = displayName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Logo/Icon Section */}
      <div className="flex flex-col items-center space-y-4">
        <Logo variant="neutral-200" className="h-7 mb-4 w-auto" />
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Welcome to Cadie 👋
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Let&apos;s personalize your experience
          </p>
        </div>
      </div>

      {/* Avatar Picker */}
      <div className="flex justify-center pb-4">
        <AvatarPicker
          value={avatarUrl}
          onChange={(url) => setAvatarUrl(url)}
          userId={user.id}
          userInitial={userInitial}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="displayName" className="sr-only">
            Your name
          </label>
          <Input
            id="displayName"
            type="text"
            placeholder="What should we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            size="lg"
            autoFocus
            className="w-full px-4 py-3 bg-[var(--bg-field-default)] border-[var(--border-primary)] text-[var(--text-primary)] text-base rounded-xl shadow-none focus:border-[var(--border-active)] placeholder:text-[var(--text-tertiary)] text-center"
          />
          {error && (
            <p className="text-sm text-[var(--accent-red-primary)] text-center">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="secondary"
          size="xl"
          className="w-full"
        >
          {isLoading ? (
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
              Setting up...
            </>
          ) : (
            "Let's go →"
          )}
        </Button>
      </form>
    </div>
  );
}
