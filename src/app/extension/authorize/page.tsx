"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ExtensionAuthorizePage() {
  const router = useRouter();
  const hasAuthorized = React.useRef(false);

  const performAuthorization = React.useCallback(async (currentUser: User) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const extensionId = params.get("extensionId");
      const installId = params.get("installId");
      const state = params.get("state");
      const extensionVersion = params.get("extensionVersion");
      const browserName = params.get("browserName") || "chrome";

      if (!extensionId || !installId || !state) {
        throw new Error("Missing extension auth session details");
      }

      // Call API to generate token
      const response = await fetch("/api/extension/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Extension",
          installId,
          state,
          clientId: "cadie-browser-extension",
          extensionVersion,
          browserName,
          platform: navigator.platform,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to authorize");
      }

      interface AuthResponse {
        token: string;
        state: string;
      }
      const data = (await response.json()) as AuthResponse;

      // Always use production URL for extension - tokens are generated against production database
      const cadieUrl = "https://cadie.app";

      // Construct authorization response
      const authData = {
        token: data.token,
        email: currentUser.email,
        cadieUrl: cadieUrl,
        state: data.state,
        installId,
        extensionId,
      };

      // Store auth data in DOM for content script
      const authDataElement = document.createElement("div");
      authDataElement.id = "cadie-auth-data";
      authDataElement.setAttribute("data-auth", JSON.stringify({
        token: authData.token,
        email: authData.email || "",
        url: authData.cadieUrl,
        state: authData.state,
        installId: authData.installId,
        extensionId: authData.extensionId,
      }));
      authDataElement.style.display = "none";
      document.body.appendChild(authDataElement);

      // Wait for extension to acknowledge before redirecting
      let hasRedirected = false;
      const redirect = () => {
        if (!hasRedirected) {
          hasRedirected = true;
          window.location.href = cadieUrl;
        }
      };

      // Listen for acknowledgment from extension via postMessage
      const ackHandler = (e: MessageEvent) => {
        if (
          e.source === window &&
          e.origin === window.location.origin &&
          e.data?.type === "CADIE_AUTH_ACK" &&
          e.data?.success &&
          e.data?.state === authData.state
        ) {
          window.removeEventListener("message", ackHandler);
          redirect();
        }
      };
      window.addEventListener("message", ackHandler);

      // Use postMessage to communicate with content script (works across isolated worlds)
      const authMessage = {
        type: "CADIE_AUTH_SUCCESS",
        token: authData.token,
        email: authData.email || "",
        url: authData.cadieUrl,
        cadieUrl: authData.cadieUrl,
        state: authData.state,
        installId: authData.installId,
        extensionId,
      };
      
      // SECURITY: Only send to same origin to prevent token theft via malicious iframes/openers
      // The content script running on this page will receive the message
      const targetOrigin = window.location.origin;
      
      // Send immediately and retry (restricted to same origin)
      window.postMessage(authMessage, targetOrigin);
      setTimeout(() => window.postMessage(authMessage, targetOrigin), 100);
      setTimeout(() => window.postMessage(authMessage, targetOrigin), 300);
      setTimeout(() => window.postMessage(authMessage, targetOrigin), 600);
      setTimeout(() => window.postMessage(authMessage, targetOrigin), 1000);

      // Fallback redirect after 2 seconds if no acknowledgment
      setTimeout(redirect, 2000);

    } catch (error) {
      console.error("Error authorizing:", error);
      // Redirect to app even on error
      window.location.href = "https://cadie.app";
    }
  }, []);

  const checkAuthAndAuthorize = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        router.push(`/auth?redirect=${encodeURIComponent("/extension/authorize" + window.location.search)}`);
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
      window.location.href = "https://cadie.app";
    }
  }, [performAuthorization, router]);

  React.useEffect(() => {
    void checkAuthAndAuthorize();
  }, [checkAuthAndAuthorize]);

  // Minimal loading state
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--fg)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
