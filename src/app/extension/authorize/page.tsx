"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ExtensionAuthorizePage() {
  const router = useRouter();
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

      // Auto-authorize immediately
      if (!hasAuthorized.current) {
        hasAuthorized.current = true;
        await performAuthorization(user);
      }
    } catch (error) {
      console.error("Error:", error);
      // Redirect to app even on error
      const cadieUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      window.location.href = cadieUrl;
    }
  }

  async function performAuthorization(currentUser: User) {
    try {
      // Call API to generate token
      const response = await fetch("/api/extension/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Extension" }),
      });

      if (!response.ok) {
        throw new Error("Failed to authorize");
      }

      const data = await response.json();

      // Get the extension ID from URL params
      const params = new URLSearchParams(window.location.search);
      const extensionId = params.get("extensionId");
      const state = params.get("state");

      // Use production URL
      const cadieUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      // Construct authorization response
      const authData = {
        token: data.token,
        email: currentUser.email,
        cadieUrl: cadieUrl,
        state: state || "",
      };

      // Store auth data in DOM for content script
      const authDataElement = document.createElement("div");
      authDataElement.id = "cadie-auth-data";
      authDataElement.setAttribute("data-auth", JSON.stringify({
        token: authData.token,
        email: authData.email || "",
        url: authData.cadieUrl,
        state: authData.state || "",
      }));
      authDataElement.style.display = "none";
      document.body.appendChild(authDataElement);

      // Dispatch custom event
      const event = new CustomEvent("cadieAuthSuccess", {
        detail: {
          extensionId,
          token: authData.token,
          email: authData.email || "",
          url: authData.cadieUrl,
          cadieUrl: authData.cadieUrl,
          state: authData.state || "",
        },
      });
      window.dispatchEvent(event);

      // Retry event after delay
      setTimeout(() => {
        window.dispatchEvent(event);
      }, 100);

      // Redirect to app immediately
      window.location.href = cadieUrl;

    } catch (error) {
      console.error("Error authorizing:", error);
      // Redirect to app even on error
      const cadieUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      window.location.href = cadieUrl;
    }
  }

  // Minimal loading state
  return (
    <div className="min-h-screen bg-[var(--bg-l0-solid)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

