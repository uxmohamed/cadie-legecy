"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { IconLoader2, IconPuzzle, IconTrash, IconPlugConnected } from "@tabler/icons-react";
import { toast } from "sonner";

interface ApiToken {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

export function SettingsExtensions() {
  const [tokens, setTokens] = React.useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);

  // Load tokens on mount
  React.useEffect(() => {
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      const response = await fetch("/api/auth/tokens");
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error("Failed to load tokens:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisconnect(tokenId: string, tokenName: string) {
    setDisconnectingId(tokenId);
    try {
      const response = await fetch(`/api/auth/tokens/${tokenId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
        toast.success(`Disconnected ${tokenName}`);
      } else {
        toast.error("Failed to disconnect extension");
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect extension");
    } finally {
      setDisconnectingId(null);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-[var(--icon-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-[var(--bg-field)] p-4 mb-4">
            <IconPlugConnected className="h-8 w-8 text-[var(--icon-secondary)]" />
          </div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            No Extensions Connected
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-[280px]">
            Install the Cadie browser extension and connect it to start saving links with one click.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border-primary)] bg-[var(--bg-field)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--bg-l1-solid)] p-2">
                  <IconPuzzle className="h-5 w-5 text-[var(--icon-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {token.name}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Connected {formatDate(token.created_at)}
                    {token.last_used_at && ` • Last used ${formatDate(token.last_used_at)}`}
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--text-secondary)] hover:text-[var(--cadie-red)] hover:bg-[var(--cadie-red)]/10"
                    disabled={disconnectingId === token.id}
                  >
                    {disconnectingId === token.id ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconTrash className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Extension</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to disconnect &quot;{token.name}&quot;? You&apos;ll need to reconnect it to continue saving links.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </AlertDialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(token.id, token.name)}
                    >
                      Disconnect
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
