"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { IconArrowRight, IconCrown, IconLoader2 } from "@tabler/icons-react";
import type { PlanTier, Entitlements } from "@/lib/billing/types";

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
  believer_badge: boolean;
}

const PLAN_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  pro: "Pro",
  believer: "Believer",
};

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

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/billing/status")
      .then((res) => res.json())
      .then((data: BillingStatus) => {
        if (mounted) setBilling(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCheckout = async (plan: PlanTier, interval: "month" | "year") => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { checkout_url?: string; error?: string };
      if (data.checkout_url) {
        window.open(data.checkout_url, "_blank");
      }
    } catch {
      // silently fail
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { portal_url?: string; error?: string };
      if (data.portal_url) {
        window.open(data.portal_url, "_blank");
      }
    } catch {
      // silently fail
    } finally {
      setIsPortalLoading(false);
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
  const isPaid = billing.plan === "pro" || billing.plan === "believer";
  const isCanceling = billing.subscription.cancel_at_period_end;
  const nearLimit = billing.warnings.near_starter_saved_items_limit;
  const atLimit =
    billing.entitlements.maxSavedItems !== null &&
    billing.usage.totalSavedItems >= billing.entitlements.maxSavedItems;

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <div className="rounded-xl border border-border bg-bg-muted p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-fg">
              {PLAN_LABELS[billing.plan]} plan
            </h3>
            {billing.believer_badge && (
              <Badge variant="warning" size="sm">
                <IconCrown className="h-3 w-3" />
                Believer
              </Badge>
            )}
            {isPaid && billing.subscription.interval && (
              <Badge variant="secondary" size="sm">
                {billing.subscription.interval === "year" ? "Yearly" : "Monthly"}
              </Badge>
            )}
          </div>
          {isPaid && (
            <Badge
              variant={isCanceling ? "warning" : "success"}
              size="sm"
            >
              {isCanceling ? "Canceling" : "Active"}
            </Badge>
          )}
        </div>

        {isCanceling && billing.subscription.current_period_end && (
          <p className="text-xs text-warning">
            Your plan will downgrade to Starter on{" "}
            {new Date(billing.subscription.current_period_end).toLocaleDateString()}.
          </p>
        )}

        {isPaid && billing.subscription.current_period_end && !isCanceling && (
          <p className="text-xs text-fg-muted">
            Renews on{" "}
            {new Date(billing.subscription.current_period_end).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Warning banner */}
      {isStarter && (nearLimit || atLimit) && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            atLimit
              ? "border-destructive/30 bg-destructive-muted text-destructive"
              : "border-warning/30 bg-warning-muted text-warning"
          }`}
        >
          {atLimit
            ? `You've reached the ${billing.entitlements.maxSavedItems}-item limit. Upgrade to Pro to continue saving.`
            : `You're approaching the ${billing.entitlements.maxSavedItems}-item limit (${billing.usage.totalSavedItems} used). Upgrade to Pro for unlimited saves.`}
        </div>
      )}

      {/* Usage */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-fg">Usage</h3>
        <div className="space-y-3">
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
        </div>
      </div>

      <Separator />

      {/* Actions */}
      {isStarter && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-fg">Upgrade</h3>
          <div className="grid gap-3">
            <Button
              className="w-full justify-between"
              disabled={isCheckoutLoading}
              onClick={() => handleCheckout("pro", "month")}
            >
              <span>Upgrade to Pro (Monthly)</span>
              <IconArrowRight className="h-4 w-4 opacity-50" />
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-between"
              disabled={isCheckoutLoading}
              onClick={() => handleCheckout("pro", "year")}
            >
              <span>Upgrade to Pro (Yearly)</span>
              <IconArrowRight className="h-4 w-4 opacity-50" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={isCheckoutLoading}
              onClick={() => handleCheckout("believer", "year")}
            >
              <span>Become a Believer (Yearly)</span>
              <IconCrown className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-fg">Manage subscription</h3>
          <Button
            variant="secondary"
            className="w-full justify-between"
            disabled={isPortalLoading}
            onClick={handlePortal}
          >
            <span>{isPortalLoading ? "Opening portal..." : "Manage subscription"}</span>
            <IconArrowRight className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      )}
    </div>
  );
}
