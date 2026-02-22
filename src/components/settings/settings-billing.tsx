"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import type { PlanTier, Entitlements } from "@/lib/billing/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingStatus {
  plan: PlanTier;
  subscription: {
    status: string;
    interval: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    support_amount_cents: number | null;
  };
  entitlements: Entitlements;
  usage: {
    totalSavedItems: number;
    spacesTotal: number;
    imagesTotal: number;
    documentsTotal: number;
  };
  warnings: {
    near_starter_saved_items_limit: boolean;
  };
}

const PLAN_LABELS = {
  starter: "Starter",
  pro: "Pro",
} as const;

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UsageMeter({
  label,
  current,
  max,
  warn,
}: {
  label: string;
  current: number;
  max: number | null;
  warn?: boolean;
}) {
  if (max === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className="text-fg tabular-nums">{current} / unlimited</span>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className={`tabular-nums ${warn ? "text-warning font-medium" : "text-fg"}`}>
          {current} / {max}
        </span>
      </div>
      <Progress
        value={pct}
        indicatorClassName={warn ? "bg-warning" : pct >= 100 ? "bg-destructive" : undefined}
      />
    </div>
  );
}

export function SettingsBilling() {
  const [billing, setBilling] = React.useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);
  const [isPortalLoading, setIsPortalLoading] = React.useState(false);
  const [isSyncLoading, setIsSyncLoading] = React.useState(false);

  const loadBilling = React.useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (!res.ok) return;
      const data = (await res.json()) as BillingStatus;
      setBilling(data);
    } catch {
      // no-op
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const handleCheckout = async (interval: "month" | "year") => {
    setIsCheckoutLoading(true);
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? (() => {
              const url = new URL(window.location.href);
              url.searchParams.set("settings", "billing");
              url.searchParams.set("billing_success", "1");
              return url.toString();
            })()
          : undefined;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro", interval, return_url: returnUrl }),
      });
      const data = (await res.json()) as { checkout_url?: string; error?: string };
      if (!res.ok || !data.checkout_url) {
        toast.error(data.error ?? "Failed to start checkout. Please try again.");
        return;
      }
      window.location.assign(data.checkout_url);
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as {
        portal_url?: string;
        error?: string;
        recoverable?: boolean;
        sync_attempted?: boolean;
        reason?: string;
      };
      if (data.portal_url) {
        window.location.assign(data.portal_url);
      } else {
        if (data.sync_attempted) {
          await loadBilling();
        }

        if (data.reason === "no_user_email") {
          toast.error("No account email is available for billing sync. Contact support if this persists.");
          return;
        }

        if (data.recoverable && data.sync_attempted) {
          toast.error("We couldn't match an active Lemon subscription yet. If you just paid, retry in a few seconds.");
          return;
        }

        toast.error(data.error ?? "Failed to open billing portal. Please try again.");
      }
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleSyncBilling = async () => {
    setIsSyncLoading(true);
    try {
      const res = await fetch("/api/billing/sync", { method: "POST" });
      const data = (await res.json()) as {
        synced?: boolean;
        source?: "local_subscription_id" | "email_bootstrap" | "customer_bootstrap" | "none";
        reason?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Failed to refresh billing status.");
        return;
      }

      if (data.synced) {
        toast.success("Billing status refreshed successfully.");
      } else {
        toast.error(data.message ?? "No active subscription found yet. If you just paid, retry in a few seconds.");
      }

      await loadBilling();
    } catch {
      toast.error("Failed to refresh billing status.");
    } finally {
      setIsSyncLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-5 w-5 animate-spin text-fg-muted" />
      </div>
    );
  }

  if (!billing) {
    return (
      <p className="text-sm text-fg-muted py-4">Failed to load billing information.</p>
    );
  }

  const isStarter = billing.plan === "starter";
  const isPaid = billing.plan !== "starter";
  const planLabel = isStarter ? PLAN_LABELS.starter : PLAN_LABELS.pro;
  const isCanceling = billing.subscription.cancel_at_period_end;
  const nearLimit = billing.warnings.near_starter_saved_items_limit;
  const atLimit =
    billing.entitlements.maxSavedItems !== null &&
    billing.usage.totalSavedItems >= billing.entitlements.maxSavedItems;
  const renewDate = formatDate(billing.subscription.current_period_end);
  const hasRecoveryState = atLimit || nearLimit || billing.subscription.status === "inactive";
  const isPastDue = billing.subscription.status === "past_due";
  const isExpired = billing.subscription.status === "expired";

  return (
    <div className="space-y-5">
      <Card className="gap-0 overflow-hidden">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{planLabel} plan</CardTitle>
                {isPaid && billing.subscription.interval && (
                  <Badge variant="secondary" size="sm">
                    {billing.subscription.interval === "year" ? "Yearly billing" : "Monthly billing"}
                  </Badge>
                )}
                {isPaid && (
                  <Badge variant={isCanceling ? "warning" : "success"} size="sm">
                    {isCanceling ? "Canceling" : "Active"}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {isStarter
                  ? "You are on Starter. Upgrade to Pro for unlimited saved items and higher limits."
                  : "Your subscription is active and managed securely through Lemon Squeezy."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-52">
              {isStarter ? (
                <>
                  <Button
                    className="w-full justify-between"
                    disabled={isCheckoutLoading}
                    onClick={() => handleCheckout("month")}
                  >
                    <span>{isCheckoutLoading ? "Opening checkout..." : "Upgrade to Pro (Monthly)"}</span>
                    <IconArrowRight className="h-4 w-4 opacity-50" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-between"
                    disabled={isCheckoutLoading}
                    onClick={() => handleCheckout("year")}
                  >
                    <span>Upgrade to Pro (Yearly)</span>
                    <IconArrowRight className="h-4 w-4 opacity-50" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full justify-between"
                  disabled={isPortalLoading}
                  onClick={handlePortal}
                >
                  <span>{isPortalLoading ? "Opening billing portal..." : "Manage subscription"}</span>
                  <IconArrowRight className="h-4 w-4 opacity-50" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-bg-muted p-3">
              <p className="text-xs uppercase tracking-wide text-fg-muted">Status</p>
              <p className="mt-1 text-sm font-medium text-fg capitalize">
                {isStarter ? "Free tier" : billing.subscription.status.replace("_", " ")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-bg-muted p-3">
              <p className="text-xs uppercase tracking-wide text-fg-muted">
                {isCanceling ? "Downgrades on" : "Next billing date"}
              </p>
              <p className="mt-1 text-sm font-medium text-fg">{renewDate ?? "Not scheduled"}</p>
            </div>
            <div className="rounded-lg border border-border bg-bg-muted p-3">
              <p className="text-xs uppercase tracking-wide text-fg-muted">Billing cycle</p>
              <p className="mt-1 text-sm font-medium text-fg">
                {billing.subscription.interval === "year"
                  ? "Yearly"
                  : billing.subscription.interval === "month"
                    ? "Monthly"
                    : "N/A"}
              </p>
            </div>
          </div>

          {isCanceling && renewDate && (
            <p className="mt-3 text-xs text-warning">
              Your subscription is set to cancel and will downgrade to Starter on {renewDate}.
            </p>
          )}

          {isPastDue && (
            <p className="mt-3 text-xs text-warning">
              We could not process your latest renewal. Open subscription management to update payment details.
            </p>
          )}

          {isExpired && (
            <p className="mt-3 text-xs text-destructive">
              Your paid access has ended. Upgrade again to restore Pro features.
            </p>
          )}
        </CardContent>
      </Card>

      {isStarter && (nearLimit || atLimit) && (
        <Card
          className={`rounded-xl border p-4 text-sm ${
            atLimit
              ? "border-destructive/30 bg-destructive-muted text-destructive"
              : "border-warning/30 bg-warning-muted text-warning"
          }`}
        >
          <CardContent className="p-0">
            {atLimit
              ? `You've reached the ${billing.entitlements.maxSavedItems}-item limit. Upgrade to Pro to continue saving.`
              : `You're approaching the ${billing.entitlements.maxSavedItems}-item limit (${billing.usage.totalSavedItems} used). Upgrade now to avoid interruptions.`}
          </CardContent>
        </Card>
      )}

      <Card className="gap-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Usage</CardTitle>
          <CardDescription>
            Track your current limits and plan capacity in real time.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-4">
          <UsageMeter
            label="Saved items"
            current={billing.usage.totalSavedItems}
            max={billing.entitlements.maxSavedItems}
            warn={nearLimit}
          />
          <UsageMeter
            label="Spaces"
            current={billing.usage.spacesTotal}
            max={billing.entitlements.maxSpaces}
          />
          <UsageMeter
            label="Images"
            current={billing.usage.imagesTotal}
            max={billing.entitlements.maxImages}
          />
          <UsageMeter
            label="Documents"
            current={billing.usage.documentsTotal}
            max={billing.entitlements.maxDocuments}
          />
        </CardContent>
      </Card>

      {isStarter && (
        <Card className="gap-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Upgrade and billing help</CardTitle>
            <CardDescription>
              Checkout is secure and hosted by Lemon Squeezy.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-3 pt-4">
            <p className="text-xs text-fg-muted">
              You&apos;ll be redirected to a secure checkout page. Access updates automatically after payment.
            </p>
            {hasRecoveryState && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isSyncLoading}
                onClick={handleSyncBilling}
              >
                {isSyncLoading ? "Refreshing..." : "Refresh billing status"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
