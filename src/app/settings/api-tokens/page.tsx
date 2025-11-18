"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, CopyIcon, TrashIcon, KeyIcon, ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

interface ApiToken {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiTokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = React.useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [tokenName, setTokenName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [newToken, setNewToken] = React.useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/tokens");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tokens");
      }

      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast.error("Failed to load API tokens");
    } finally {
      setIsLoading(false);
    }
  }

  async function createToken() {
    if (!tokenName.trim()) {
      toast.error("Please enter a token name");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create token");
      }

      const data = await response.json();
      setNewToken(data.token);
      setTokens((prev) => [
        {
          id: data.id,
          name: data.name,
          created_at: data.created_at,
          last_used_at: null,
        },
        ...prev,
      ]);
      setTokenName("");
      toast.success("API token created successfully");
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create token");
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteToken(id: string, name: string) {
    if (!confirm(`Are you sure you want to revoke the token "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/tokens/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete token");
      }

      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast.success("API token revoked");
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("Failed to revoke token");
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    setNewToken(null);
    setTokenName("");
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeftIcon className="mr-2" />
            Back to Vault
          </Button>
          <h1 className="text-3xl font-bold text-neutral-900">API Tokens</h1>
          <p className="text-neutral-600 mt-2">
            Manage API tokens for browser extensions and third-party integrations
          </p>
        </div>

        {/* Create Token Button */}
        <div className="mb-6">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <KeyIcon className="mr-2" />
            Generate New Token
          </Button>
        </div>

        {/* Tokens List */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500">
              Loading tokens...
            </div>
          ) : tokens.length === 0 ? (
            <div className="p-8 text-center">
              <KeyIcon className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <p className="text-neutral-600 mb-2">No API tokens yet</p>
              <p className="text-sm text-neutral-500">
                Create a token to use with the browser extension or API
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{token.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-neutral-500">
                      <span>Created: {formatDate(token.created_at)}</span>
                      <span>Last used: {formatDate(token.last_used_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive-outline"
                    size="sm"
                    onClick={() => deleteToken(token.id, token.name)}
                  >
                    <TrashIcon />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Token Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
          <DialogPopup>
            <DialogTitle>
              {newToken ? "Token Created" : "Generate New API Token"}
            </DialogTitle>

            {newToken ? (
              // Show the new token (only once)
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    ⚠️ Save this token now!
                  </p>
                  <p className="text-sm text-yellow-800">
                    You won't be able to see it again. If you lose it, you'll need to generate a new one.
                  </p>
                </div>

                <div>
                  <Label>Your API Token</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newToken}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToken(newToken)}
                    >
                      <CopyIcon />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <DialogClose>
                    <Button onClick={closeCreateDialog}>Done</Button>
                  </DialogClose>
                </div>
              </div>
            ) : (
              // Token creation form
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    placeholder="e.g., Chrome Extension"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createToken()}
                    className="mt-2"
                  />
                  <p className="text-sm text-neutral-500 mt-2">
                    Give your token a descriptive name to remember where it's used
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createToken}
                    disabled={isCreating || !tokenName.trim()}
                  >
                    {isCreating ? "Creating..." : "Generate Token"}
                  </Button>
                </div>
              </div>
            )}
          </DialogPopup>
        </Dialog>
      </div>
    </div>
  );
}

