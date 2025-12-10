import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkItemSkeleton() {
    return (
        <div className="group/item relative flex items-center gap-2 w-full p-2 border border-transparent rounded-lg">
            {/* Drag Handle Skeleton */}
            <div className="w-4 h-4 opacity-0" />

            {/* Selection Checkbox Skeleton */}
            <Skeleton className="h-4 w-4 rounded-sm" />

            {/* Favicon Skeleton */}
            <Skeleton className="h-4 w-4 rounded-full" />

            {/* Title Skeleton */}
            <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-48" />
            </div>

            {/* URL/Domain Skeleton */}
            <div className="hidden sm:block w-32">
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Date Skeleton */}
            <div className="w-24 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
            </div>

            {/* Actions Skeleton */}
            <div className="flex items-center gap-1 opacity-0">
                <div className="w-8 h-8" />
                <div className="w-8 h-8" />
            </div>
        </div>
    );
}
