"use client";

import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider wrapper for Skiff UI integration
 * Currently using CSS variables for theme tokens
 * Skiff's AppThemeProvider can be added later if needed
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
