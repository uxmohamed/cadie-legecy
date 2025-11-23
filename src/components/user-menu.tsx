"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const router = useRouter();

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        setIsSigningOut(false);
        return;
      }
      
      // Force a hard redirect to clear all state
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg hover:bg-neutral-100 px-3 py-2"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} alt={user.email} />
          <AvatarFallback className="bg-neutral-900 text-white">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-200 bg-white shadow-lg z-50">
            <div className="border-b border-neutral-200 px-4 py-3">
              <p className="text-sm font-medium text-neutral-900">
                {user.email}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {user.id.slice(0, 8)}...
              </p>
            </div>
            <div className="p-2">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

