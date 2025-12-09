"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getDefaultAvatar } from "@/lib/avatar";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface OnboardingState {
  isLoading: boolean;
  needsOnboarding: boolean;
  profile: UserProfile | null;
}

/**
 * Check if user needs onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .single();

  // If no profile exists or error, user needs onboarding
  if (error || !data) {
    return true;
  }

  return !data.onboarding_completed;
}

/**
 * Complete onboarding and save profile
 */
export async function completeOnboarding(
  userId: string,
  displayName: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  console.log("completeOnboarding called with:", { userId, displayName, avatarUrl });
  
  const supabase = createClient();

  const payload = {
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  console.log("Upserting payload:", payload);

  // Save to user_profiles table
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select();

  console.log("Upsert result - data:", data, "error:", error);

  if (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: error.message };
  }

  // Also sync to auth.users.user_metadata so it appears in Supabase Dashboard
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: displayName,
      name: displayName,
      avatar_url: avatarUrl,
      picture: avatarUrl,
    }
  });

  if (authError) {
    console.warn("Failed to sync to auth.users metadata:", authError);
    // Don't fail the overall operation, user_profiles is the source of truth
  }

  return { success: true };
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url, onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle(); // Use maybeSingle instead of single to avoid 406 when no row exists

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Hook for managing onboarding state
 */
export function useOnboarding(user: User | null): OnboardingState & {
  complete: (displayName: string, avatarUrl: string) => Promise<boolean>;
  refetch: () => Promise<void>;
} {
  const [state, setState] = React.useState<OnboardingState>({
    isLoading: true,
    needsOnboarding: false,
    profile: null,
  });

  const checkStatus = React.useCallback(async () => {
    if (!user) {
      setState({ isLoading: false, needsOnboarding: false, profile: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const profile = await getUserProfile(user.id);
      const needsOnboarding = !profile || !profile.onboarding_completed;

      setState({
        isLoading: false,
        needsOnboarding,
        profile,
      });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setState({
        isLoading: false,
        needsOnboarding: true, // Assume needs onboarding on error
        profile: null,
      });
    }
  }, [user]);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const complete = React.useCallback(async (displayName: string, avatarUrl: string): Promise<boolean> => {
    if (!user) return false;

    const result = await completeOnboarding(user.id, displayName, avatarUrl);
    
    if (result.success) {
      setState({
        isLoading: false,
        needsOnboarding: false,
        profile: {
          display_name: displayName,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        },
      });
    }

    return result.success;
  }, [user]);

  return {
    ...state,
    complete,
    refetch: checkStatus,
  };
}

/**
 * Get initial avatar for a user
 * - Google OAuth: Use their Google avatar
 * - Email/Magic Link: Use a random preset avatar
 */
export function getInitialAvatar(user: User): string {
  // Check for Google avatar
  const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (googleAvatar) {
    return googleAvatar;
  }

  // Fall back to random preset based on user ID
  return getDefaultAvatar(user.id);
}

/**
 * Get initial display name for a user
 * - Google OAuth: Use their Google name
 * - Email/Magic Link: Empty (user must enter)
 */
export function getInitialDisplayName(user: User): string {
  return user.user_metadata?.full_name || user.user_metadata?.name || "";
}
