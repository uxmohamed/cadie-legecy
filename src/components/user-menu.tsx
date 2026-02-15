"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { clearUIStore } from "@/features/links/store/ui-store";
import { clearAllCaches } from "@/lib/query/auth-reset";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useShortcuts } from "@/components/shortcut-context";
import { useTheme } from "@/components/theme-provider";
import { IconMoon, IconMessage, IconSettings, IconBrandX, IconKeyboard, IconLogout, IconShip, IconExternalLink } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { getDefaultAvatar } from "@/lib/avatar";
import { getUserProfile } from "@/hooks/use-onboarding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import dynamic from "next/dynamic";

const SettingsDialog = dynamic(
  () => import("@/components/settings-dialog").then((mod) => mod.SettingsDialog),
  { ssr: false }
);

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { toggleHelp } = useShortcuts();
  const { theme, setTheme } = useTheme();
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Fetch profile from user_profiles table
  const [profile, setProfile] = React.useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  
  const refetchProfile = React.useCallback(() => {
    getUserProfile(user.id).then(setProfile);
  }, [user.id]);
  
  React.useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

  const handleSignOut = React.useCallback(async () => {
    try {
      setIsSigningOut(true);
      
      // Clear all caches before signing out to prevent data leakage between accounts
      // This clears: TanStack Query cache, IndexedDB persisted cache, and UI store
      await clearAllCaches(queryClient);
      clearUIStore();
      
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
  }, [queryClient]);

  // Handle looping keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    // Auto-focus the first menu item when menu opens
    const menuContent = menuRef.current;
    if (menuContent) {
      const items = Array.from(
        menuContent.querySelectorAll('[role="menuitem"]:not([data-disabled])')
      ) as HTMLElement[];
      
      if (items.length > 0) {
        // Small delay to ensure menu is fully rendered
        setTimeout(() => {
          items[0]?.focus();
        }, 50);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      const menuContent = menuRef.current;
      if (!menuContent) return;

      // Get all focusable menu items (excluding separators and disabled items)
      const items = Array.from(
        menuContent.querySelectorAll('[role="menuitem"]:not([data-disabled])')
      ) as HTMLElement[];

      if (items.length === 0) return;

      // Always prevent default and stop propagation when menu is open
      // This ensures arrow keys don't affect background links
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = items.findIndex((item) => item === document.activeElement);
      
      // If no item is focused yet, focus the first one
      if (currentIndex === -1) {
        items[0]?.focus();
        return;
      }

      if (e.key === 'ArrowDown') {
        // Loop to first item if at the end, otherwise go to next
        const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        // Loop to last item if at the beginning, otherwise go to previous
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
      }
    };

    // Use capture phase to intercept events before they reach other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  // Use profile data first, fall back to Google metadata
  const userName = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
  const userAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || getDefaultAvatar(user.id);

  // Determine if dark mode is effectively active
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      setIsDarkMode(true);
    } else if (theme === 'light') {
      setIsDarkMode(false);
    } else if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeToggle = React.useCallback((checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  }, [setTheme]);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 hover:bg-[var(--bg-hover)]"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage 
                src={userAvatar} 
                alt={user.email} 
              />
              <AvatarFallback className="bg-[var(--bg-inverse)] text-[var(--fg-inverse)]">
                {userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent ref={menuRef} align="end" className="w-64">
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
          <DropdownMenuItem asChild>
            <a 
              href="https://x.com/messages/compose?recipient_id=1649994120725778432" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="cursor-pointer w-full flex items-center group"
            >
              <IconMessage className="h-4 w-4 text-[var(--icon-secondary)]" />
              Beta Feedback
              <IconExternalLink className="ml-auto h-4 w-4 text-[var(--icon-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              setIsOpen(false);
              setIsSettingsOpen(true);
            }}
          >
            <IconSettings className="h-4 w-4 text-[var(--icon-secondary)]" />
            Settings
            <Kbd className="ml-auto">,</Kbd>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleThemeToggle(!isDarkMode);
            }}
            onClick={(e) => {
              e.preventDefault();
              handleThemeToggle(!isDarkMode);
            }}
          >
            <IconMoon className="h-4 w-4 text-[var(--icon-secondary)]" />
            Dark mode
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
              className="ml-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/changelog" className="cursor-pointer w-full flex items-center group">
              <IconShip className="h-4 w-4 text-[var(--icon-secondary)]" />
              Changelog
              <IconExternalLink className="ml-auto h-4 w-4 text-[var(--icon-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="https://x.com/cadieapp_" target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full flex items-center group">
              <IconBrandX className="h-4 w-4 text-[var(--icon-secondary)]" />
              Follow us on X
              <IconExternalLink className="ml-auto h-4 w-4 text-[var(--icon-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              toggleHelp();
            }}
            className="cursor-pointer"
          >
            <IconKeyboard className="h-4 w-4 text-[var(--icon-secondary)]" />
            Keyboard Shortcuts
            <Kbd className="ml-auto">⌘/</Kbd>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="cursor-pointer"
          >
            <IconLogout className="h-4 w-4 text-[var(--icon-secondary)]" />
            {isSigningOut ? "Signing out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        user={user}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onProfileUpdate={refetchProfile}
      />
    </>
  );
}
