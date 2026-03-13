"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";
import { log } from "@/lib/logger";

export function useBillingRealtimeInvalidation(
  isAuthenticated: boolean,
  userId?: string
): void {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`billing_for_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_billing",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.billing.all,
            refetchType: "active",
          });
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          if (status === "SUBSCRIBED") {
            log.info("Billing realtime: subscribed", { userId });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            log.warn("Billing realtime: subscription issue", { status, userId });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Ignore cleanup errors.
      });
    };
  }, [isAuthenticated, userId, queryClient]);
}
