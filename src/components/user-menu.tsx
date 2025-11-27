"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useShortcuts } from "@/components/shortcut-context";
import { useTheme } from "@/components/theme-provider";
import { IconMoon, IconSun, IconDeviceDesktop, IconCheck } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/menu";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const router = useRouter();
  const { toggleHelp, registerShortcut, unregisterShortcut } = useShortcuts();
  const { theme, setTheme } = useTheme();

  const handleSignOut = React.useCallback(async () => {
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
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  }, []);

  React.useEffect(() => {
    registerShortcut({
      key: "Q", // Alt + Shift + Q
      description: "Sign out",
      category: "Global",
      action: handleSignOut,
    });

    // We don't need to register Cmd+/ as it's already handled globally by the context provider
    // but we do need to handle the keydown event for the specific combination if not handled there
    // However, looking at the context, it seems ? is registered, but not Cmd+/ explicitly as a shortcut entry
    // Let's register it for documentation purposes if nothing else, but the event listener below handles the actual logic
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sign out: Alt + Shift + Q
      if (e.altKey && e.shiftKey && (e.key === "Q" || e.key === "q")) {
        e.preventDefault();
        handleSignOut();
      }
      // Shortcuts: Meta + /
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toggleHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unregisterShortcut("Q");
    };
  }, [handleSignOut, toggleHelp, registerShortcut, unregisterShortcut]);

  const userName = user.user_metadata?.full_name || user.user_metadata?.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2.5 rounded-lg hover:bg-[var(--bg-field-hover)] px-3 py-2 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} alt={user.email} />
            <AvatarFallback className="bg-[var(--bg-inverse)] text-[var(--text-inverse)]">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-3">
          {userName ? (
            <>
              <p className="text-sm font-medium text-[var(--overlay-text-primary)] truncate">
                {userName}
              </p>
              <p className="text-xs text-[var(--overlay-text-secondary)] truncate mt-0.5">
                {user.email}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-[var(--overlay-text-primary)] truncate">
              {user.email}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleHelp} className="cursor-pointer">
          Shortcuts
          <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/changelog" className="cursor-pointer w-full flex items-center justify-between">
            Changelog
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://x.com/caddyapp_" target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full flex items-center justify-between">
            Follow us on X
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
          <IconSun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && <IconCheck className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
          <IconMoon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && <IconCheck className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
          <IconDeviceDesktop className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && <IconCheck className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
          <DropdownMenuShortcut>⌥⇧Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

