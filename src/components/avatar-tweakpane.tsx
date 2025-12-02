"use client";

import * as React from "react";
import { Pane } from "tweakpane";
import { getAvatarPath } from "@/lib/avatar";

interface AvatarTweakpaneProps {
  onAvatarChange: (avatarPath: string | null) => void;
}

const STORAGE_KEY = "caddy-test-avatar";

export function AvatarTweakpane({ onAvatarChange }: AvatarTweakpaneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const paneInstanceRef = React.useRef<Pane | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    // Get initial value from localStorage or default to null
    const storedValue = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initialAvatarNumber = storedValue ? parseInt(storedValue, 10) : null;

    // Validate initial value is between 1-12
    const currentValue: number | null = 
      initialAvatarNumber && initialAvatarNumber >= 1 && initialAvatarNumber <= 12 
        ? initialAvatarNumber 
        : null;

    // Create options for avatar selection (1-12)
    const options: Record<string, number> = {};
    options["Default"] = 0; // Use 0 to represent default/null
    for (let i = 1; i <= 12; i++) {
      options[`Avatar ${i}`] = i;
    }

    // Create params object with initial value (use 0 for default)
    const params = {
      avatar: currentValue ?? 0,
    };

    // Initialize Tweakpane
    const pane = new Pane({
      container: containerRef.current,
      title: "Avatar Tester",
      expanded: true,
    });

    paneInstanceRef.current = pane;

    // Add select binding
    pane.addBinding(params, "avatar", {
      options: options,
      label: "Avatar",
    });

    // Handle change
    pane.on("change", () => {
      const value = params.avatar;
      
      // Convert 0 back to null for default
      const avatarNumber: number | null = value === 0 ? null : value;

      // Save to localStorage
      if (typeof window !== "undefined") {
        if (avatarNumber === null) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, String(avatarNumber));
        }
      }

      // Notify parent component
      if (avatarNumber === null) {
        onAvatarChange(null);
      } else {
        onAvatarChange(getAvatarPath(avatarNumber));
      }
    });

    // Initial callback
    if (currentValue !== null) {
      onAvatarChange(getAvatarPath(currentValue));
    } else {
      onAvatarChange(null);
    }

    // Cleanup
    return () => {
      pane.dispose();
      paneInstanceRef.current = null;
    };
  }, [onAvatarChange]);

  return <div ref={containerRef} className="fixed top-4 right-4 z-50" />;
}
