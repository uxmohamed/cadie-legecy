import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUrl(url: string): string {
  try {
    // Remove protocol (http://, https://)
    let cleaned = url.replace(/^https?:\/\//i, "");
    
    // Remove www. subdomain
    cleaned = cleaned.replace(/^www\./i, "");
    
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, "");
    
    return cleaned;
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Just now (less than 1 minute)
  if (diffMinutes < 1) {
    return "now";
  }

  // Xm (less than 1 hour)
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  // Xh (less than 24 hours)
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Xd (less than 7 days)
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  // Short weekday for 7-13 days (Mon, Tue, etc.)
  if (diffDays < 14) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  // This year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Older: show short date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
