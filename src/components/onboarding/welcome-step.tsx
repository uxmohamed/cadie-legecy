"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
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
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container - Matching Figma Design */}
      <div 
        className="bg-[var(--bg-pure-white)] rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px]"
        style={{
          boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
          borderWidth: '0px'
        }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-[2px] items-center w-full">
          <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
          Customize your Account
          </h1>
          <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
          Give your account an profile picture and name
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
                className="w-full px-4 py-4 bg-[#f5f5f5] border border-transparent text-[var(--text-primary)] text-[14px] font-medium rounded-[12px] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2783de] placeholder:text-[#a3a3a3] disabled:opacity-50 text-left"
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--accent-red-primary)] text-center w-full">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#2783de] text-white flex items-center justify-center p-3 rounded-[12px] w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <>
                <svg
                  className="size-4 animate-spin mr-2"
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
          </button>
        </form>
      </div>
    </div>
  );
}
