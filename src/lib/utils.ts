import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clean a URL for display by removing protocol and trailing slashes
 */
export function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let clean = urlObj.hostname + urlObj.pathname;
    // Remove trailing slash if it's the only path
    if (clean.endsWith('/') && urlObj.pathname === '/') {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return url;
  }
}

/**
 * Format a date for display in compact format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'now';
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}y`;
  }
}

