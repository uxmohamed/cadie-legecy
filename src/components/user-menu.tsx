"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg hover:bg-neutral-100 px-3 py-2"
      >
        <div className="h-8 w-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
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
                className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

