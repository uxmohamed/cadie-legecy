"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ExtensionAuthorizePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthorizing, setIsAuthorizing] = React.useState(false);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        router.push(`/auth?redirect=/extension/authorize`);
        return;
      }

      setUser(user);
    } catch (error) {
      console.error("Error checking auth:", error);
      setError("Failed to check authentication");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthorize() {
    if (!user) return;

    try {
      setIsAuthorizing(true);
      setError(null);

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

      // Get the extension ID from URL params (passed by extension)
      const params = new URLSearchParams(window.location.search);
      const extensionId = params.get("extensionId");
      const state = params.get("state");

      // Use production URL - prefer NEXT_PUBLIC_SITE_URL if available, otherwise use current origin
      const vaultUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      // Construct authorization response
      const authData = {
        token: data.token,
        email: user.email,
        vaultUrl: vaultUrl,
        state: state || "",
      };

      if (extensionId) {
        // Redirect to extension with auth data
        redirectToExtension(authData, extensionId);
      } else {
        // No extension ID, show success message
        showManualCopyOption(authData);
      }
    } catch (error) {
      console.error("Error authorizing:", error);
      setError(error instanceof Error ? error.message : "Failed to authorize");
      setIsAuthorizing(false);
    }
  }

  function redirectToExtension(authData: any, extensionId: string) {
    // Store auth data in a data attribute on the page so content script can read it
    // This avoids the chrome-extension:// redirect issue
    const authDataElement = document.createElement("div");
    authDataElement.id = "vault-auth-data";
    authDataElement.setAttribute("data-auth", JSON.stringify({
      token: authData.token,
      email: authData.email || "",
      url: authData.vaultUrl,
      state: authData.state || "",
    }));
    authDataElement.style.display = "none";
    document.body.appendChild(authDataElement);

    // Dispatch a custom event that the content script can listen for
    const event = new CustomEvent("vaultAuthSuccess", {
      detail: {
        extensionId,
        token: authData.token,
        email: authData.email || "",
        url: authData.vaultUrl,
        vaultUrl: authData.vaultUrl,
        state: authData.state || "",
      },
    });
    window.dispatchEvent(event);

    // Also try dispatching after a short delay to ensure content script is ready
    setTimeout(() => {
      window.dispatchEvent(event);
    }, 100);

    // Show success message - extension will handle opening options page
    console.log("Authorization successful! Extension should open automatically...");
    
    // Set success state
    setIsAuthorizing(false);
    setIsAuthorized(true);
  }

  function showManualCopyOption(authData: any) {
    // For now, just show success and let user close
    alert("Authorization successful! You can close this tab and return to the extension.");
    window.close();
  }

  function handleCancel() {
    window.close();
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

  if (isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-green-200 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Authorization Successful!</h1>
          <p className="text-neutral-600 mb-4">
            The extension should open automatically. If it doesn't, check your extension settings.
          </p>
          <Button onClick={() => window.close()}>Close</Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-red-200 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Authorization Failed</h1>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Return to Vault</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg border border-neutral-200 shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Authorize Vault Extension
          </h1>
          <p className="text-neutral-600">
            Connect your Chrome extension to your Vault account
          </p>
        </div>

        {/* User Info */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-neutral-600 mb-1">Connected as</p>
          <p className="font-medium text-neutral-900">{user?.email}</p>
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-neutral-900 mb-3">
            The extension will be able to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-neutral-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Save links to your Vault</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-neutral-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Access your saved links</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-neutral-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Work with your categories</span>
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-800">
            ⚠️ Only authorize if you installed the extension yourself. 
            You can revoke access anytime from your Vault settings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isAuthorizing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="flex-1"
          >
            {isAuthorizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Authorizing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Authorize Extension
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-neutral-500 text-center mt-6">
          This will create an API token for the extension to access your Vault.
        </p>
      </div>
    </div>
  );
}

