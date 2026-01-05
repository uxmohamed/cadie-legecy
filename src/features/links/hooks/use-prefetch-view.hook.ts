"use client";

import * as React from "react";
import { mutate } from "swr";
import { buildLinksCacheKey } from "./use-links.hook";
import type { LinkFilters } from "@/features/links/types";

const PREFETCH_PAGE_SIZE = 50;
const PREFETCH_DELAY_MS = 2000;

export function usePrefetchView(
    currentView: "all" | "trash",
    userId: string | undefined
) {
    const hasPrefetchedRef = React.useRef(false);

    React.useEffect(() => {
        if (!userId || hasPrefetchedRef.current) return;
        if (typeof window === "undefined") return;

        const prefetch = async () => {
            const oppositeFilters: LinkFilters =
                currentView === "trash"
                    ? { is_deleted: false, is_archived: false }
                    : { is_deleted: true };

            const cacheKey = buildLinksCacheKey(
                userId,
                oppositeFilters,
                "",
                0,
                PREFETCH_PAGE_SIZE
            );
            if (!cacheKey) return;

            try {
                const fetchUrl = cacheKey.split("#")[0];
                const response = await fetch(fetchUrl);
                if (!response.ok) return;

                const data = await response.json();
                mutate(cacheKey, [data], { revalidate: false });
            } catch {
                // Prefetch is best-effort only
            } finally {
                hasPrefetchedRef.current = true;
            }
        };

        const scheduleId = window.setTimeout(() => {
            const maybeIdleCallback = (window as typeof window & {
                requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
            }).requestIdleCallback;

            if (maybeIdleCallback) {
                maybeIdleCallback(() => {
                    void prefetch();
                }, { timeout: 5000 });
            } else {
                void prefetch();
            }
        }, PREFETCH_DELAY_MS);

        return () => {
            window.clearTimeout(scheduleId);
        };
    }, [currentView, userId]);
}

