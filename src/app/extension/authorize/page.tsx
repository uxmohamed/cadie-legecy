"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ExtensionAuthorizePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasAuthorized = React.useRef(false);

  React.useEffect(() => {
    checkAuthAndAuthorize();
  }, []);

  async function checkAuthAndAuthorize() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        const currentUrl = window.location.href;
        router.push(`/auth?redirect=${encodeURIComponent('/extension/authorize' + window.location.search)}`);
        return;
      }

      setUser(user);
      setIsLoading(false);
      
      // Auto-authorize immediately
      if (!hasAuthorized.current) {
        hasAuthorized.current = true;
        await performAuthorization(user);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setError("Failed to check authentication");
      setIsLoading(false);
    }
  }

  async function performAuthorization(currentUser: User) {
    try {
      // Call API to generate token
      const response = await fetch("/api/extension/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Chrome Extension" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to authorize");
      }

      const data = await response.json();

      // Get the extension ID from URL params
      const params = new URLSearchParams(window.location.search);
      const extensionId = params.get("extensionId");
      const state = params.get("state");

      // Use production URL
      const caddyUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      // Construct authorization response
      const authData = {
        token: data.token,
        email: currentUser.email,
        caddyUrl: caddyUrl,
        state: state || "",
      };

      // Store auth data in DOM for content script
      const authDataElement = document.createElement("div");
      authDataElement.id = "caddy-auth-data";
      authDataElement.setAttribute("data-auth", JSON.stringify({
        token: authData.token,
        email: authData.email || "",
        url: authData.caddyUrl,
        state: authData.state || "",
      }));
      authDataElement.style.display = "none";
      document.body.appendChild(authDataElement);

      // Dispatch custom event
      const event = new CustomEvent("caddyAuthSuccess", {
        detail: {
          extensionId,
          token: authData.token,
          email: authData.email || "",
          url: authData.caddyUrl,
          caddyUrl: authData.caddyUrl,
          state: authData.state || "",
        },
      });
      window.dispatchEvent(event);

      // Retry event after delay
      setTimeout(() => {
        window.dispatchEvent(event);
      }, 100);

      setIsAuthorized(true);
      
      // Redirect to app after 2 seconds
      setTimeout(() => {
        window.location.href = caddyUrl;
        // Also try to close the tab
        setTimeout(() => window.close(), 500);
      }, 2000);

    } catch (error) {
      console.error("Error authorizing:", error);
      setError(error instanceof Error ? error.message : "Failed to authorize");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Authorization Failed</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-green-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Connected! ✨</h1>
          <p className="text-neutral-600 mb-2">
            Your Chrome extension is now connected to Caddy
          </p>
          <p className="text-sm text-neutral-500">
            Redirecting to app...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

