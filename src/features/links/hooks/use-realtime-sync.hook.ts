"use client";

import * as React from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/features/links/types";
import { useLinksStore } from "@/features/links/store/links-store";
import { log } from "@/lib/logger";

type LinkRow = Link;

export function useRealtimeSync(isAuthenticated: boolean, userId?: string): void {
  const applyInsertOrUpdate = useLinksStore(
    (state) => state.applyRealtimeInsertOrUpdate,
  );
  const applyDelete = useLinksStore((state) => state.applyRealtimeDelete);

  React.useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`links_for_user_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<LinkRow>) => {
          const { eventType } = payload;
          const newLink = payload.new as LinkRow | null;
          const oldLink = payload.old as LinkRow | null;

          if (eventType === "DELETE") {
            if (oldLink) {
              applyDelete(oldLink);
            }
            return;
          }

          if (eventType === "INSERT" || eventType === "UPDATE") {
            if (newLink) {
              applyInsertOrUpdate(newLink);
            }
          }
        },
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          if (status === "SUBSCRIBED") {
            log.info("Realtime: Successfully subscribed (store)", { userId });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            log.warn("Realtime: Subscription issue (store)", { status, userId });
          }
        }
      });

    return () => {
      supabase
        .removeChannel(channel)
        .catch(() => {
          // Ignore cleanup errors
        });
    };
  }, [applyDelete, applyInsertOrUpdate, isAuthenticated, userId]);
}

