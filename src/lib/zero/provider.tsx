"use client";

import * as React from "react";
import { Zero } from "@rocicorp/zero";
import { getZero, closeZero, type ZeroClient } from "./client";
import type { Schema } from "./schema";

/**
 * Zero context for providing the Zero instance to components
 */
const ZeroContext = React.createContext<ZeroClient | null>(null);

interface ZeroProviderProps {
  userId: string;
  children: React.ReactNode;
}

/**
 * Provider component that creates and manages the Zero instance
 */
export function ZeroProvider({ userId, children }: ZeroProviderProps) {
  const [zero, setZero] = React.useState<ZeroClient | null>(null);

  React.useEffect(() => {
    // Create Zero instance when userId is available
    if (userId) {
      const instance = getZero(userId);
      setZero(instance);
    }

    // Cleanup on unmount or user change
    return () => {
      // Don't close on unmount - we want to preserve the instance
      // closeZero will be called explicitly on logout
    };
  }, [userId]);

  return (
    <ZeroContext.Provider value={zero}>
      {children}
    </ZeroContext.Provider>
  );
}

/**
 * Hook to access the Zero instance
 */
export function useZero(): ZeroClient | null {
  return React.useContext(ZeroContext);
}

/**
 * Hook to access the Zero instance, throwing if not available
 */
export function useZeroRequired(): ZeroClient {
  const zero = React.useContext(ZeroContext);
  if (!zero) {
    throw new Error("useZeroRequired must be used within a ZeroProvider with a valid userId");
  }
  return zero;
}
