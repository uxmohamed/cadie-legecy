"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { AvatarPicker } from "./avatar-picker";
import { getInitialAvatar, getInitialDisplayName } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";

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
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-[2px] items-center w-full">
        <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
          Customize your Account
        </h1>
        <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
          Give your account a profile picture and name
        </p>
      </div>

      {/* Avatar Picker Section */}
      <div className="flex justify-center w-full">
        <AvatarPicker
          value={avatarUrl}
          onChange={(url) => setAvatarUrl(url)}
          userId={user.id}
          userInitial={userInitial}
        />
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-[32px] items-start w-full">
        <div className="flex flex-col gap-[12px] w-full">
          <label htmlFor="displayName" className="text-[14px] font-medium text-[var(--text-tertiary)]">
            Your name
          </label>
          <div className="w-full">
            <input
              id="displayName"
              type="text"
              placeholder="What should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-4 bg-[var(--bg-field-default)] border border-transparent text-[var(--text-primary)] text-[14px] font-medium rounded-[12px] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2783de] placeholder:text-[var(--text-tertiary)] disabled:opacity-50 text-left"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--accent-red-primary)] text-center w-full">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="default"
          className="w-full p-3 rounded-[12px] text-white"
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
              <span className="font-medium text-[14px] leading-[24px] text-white">
                Setting up...
              </span>
            </>
          ) : (
            <span className="font-medium text-[14px] leading-[24px] text-white">
              Continue
            </span>
          )}
        </Button>
      </form>
    </>
  );
}
