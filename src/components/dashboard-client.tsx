"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardContent } from "@/components/dashboard-content";
import { LinkListSkeleton } from "@/components/skeletons";
import { OnboardingFlow } from "@/components/onboarding";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";

/**
 * Initial data structure for server-side prefetched links
 */
interface InitialLinksData {
  links: Link[];
  total: number;
}

interface DashboardClientProps {
  user: User;
  initialView?: "trash" | null;
  /** Server-side prefetched links for instant render */
  initialLinks?: InitialLinksData;
}

export function DashboardClient({ user, initialView = null, initialLinks }: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [profileChecked, setProfileChecked] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  
  // Determine view from URL path or initialView prop
  const isTrashRoute = pathname === "/trash" || initialView === "trash";
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    isTrashRoute ? "trash" : null
  );
  
  const [sortBy, setSortBy] = React.useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "");
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [selectedLinks, setSelectedLinks] = React.useState<Link[]>([]);
  const clearSelectionRef = React.useRef<(() => void) | null>(null);
  const batchHandlersRef = React.useRef<{
    onBatchDelete: (ids: string[]) => Promise<void>;
    onBatchRestore: (ids: string[]) => Promise<void>;
    onBatchPermanentDelete: (ids: string[]) => Promise<void>;
    onBatchPin: (ids: string[]) => void;
    onBatchUnpin: (ids: string[]) => void;
  } | null>(null);
  
  // Sync selectedCategoryId with URL path changes
  React.useEffect(() => {
    if (pathname === "/trash") {
      setSelectedCategoryId("trash");
    } else if (pathname === "/") {
      setSelectedCategoryId(null);
    }
  }, [pathname]);

  const handleSortChange = React.useCallback(
    (newSortBy: "date" | "title") => {
      if (sortBy === newSortBy) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(newSortBy);
        setSortOrder("desc");
      }
    },
    [sortBy, sortOrder]
  );

  const handleToggleAddMode = React.useCallback(() => {
    if (selectedCategoryId === "trash") return;
    setIsAddingItem((prev) => !prev);
  }, [selectedCategoryId]);

  const handleOpenAddMode = React.useCallback(() => {
    if (selectedCategoryId === "trash") return;
    setIsAddingItem(true);
  }, [selectedCategoryId]);

  const handleAddInputChange = React.useCallback((value: string) => {
    setAddInputValue(value);
  }, []);

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleAddSubmit = React.useCallback(() => {
    setAddInputValue("");
    setIsAddingItem(false);
  }, []);

  const handleAddCancel = React.useCallback(() => {
    setAddInputValue("");
    setIsAddingItem(false);
  }, []);

  const handleSelectionChange = React.useCallback(
    (count: number, links: Link[], clearSelection: () => void, batchHandlers: {
      onBatchDelete: (ids: string[]) => Promise<void>;
      onBatchRestore: (ids: string[]) => Promise<void>;
      onBatchPermanentDelete: (ids: string[]) => Promise<void>;
      onBatchPin: (ids: string[]) => void;
      onBatchUnpin: (ids: string[]) => void;
    }) => {
      setSelectedCount(count);
      setSelectedLinks(links);
      clearSelectionRef.current = clearSelection;
      batchHandlersRef.current = batchHandlers;
    },
    []
  );

  // Handle view change with URL navigation
  const handleViewChange = React.useCallback((categoryId: string | null) => {
    if (categoryId === "trash") {
      router.push("/trash");
    } else {
      router.push("/");
    }
    setSelectedCategoryId(categoryId);
  }, [router]);

  // Check onboarding status on mount
  React.useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.needs_onboarding) {
        setNeedsOnboarding(true);
      }
      setProfileChecked(true);
    };

    checkProfile();
  }, [user.id]);

  // Show onboarding if needed
  if (profileChecked && needsOnboarding) {
    return (
      <OnboardingFlow
        user={user}
        onComplete={() => {
          setNeedsOnboarding(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <DashboardShell
      user={user}
      selectedCategoryId={selectedCategoryId}
      onViewChange={handleViewChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
      isAddingItem={isAddingItem}
      onToggleAddMode={handleToggleAddMode}
      onOpenAddMode={handleOpenAddMode}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      selectedCount={selectedCount}
      selectedLinks={selectedLinks}
      onClearSelection={() => clearSelectionRef.current?.()}
      onBatchDelete={async () => {
        const ids = selectedLinks.map(link => link.id);
        if (ids.length > 0 && batchHandlersRef.current) {
          await batchHandlersRef.current.onBatchDelete(ids);
          clearSelectionRef.current?.();
        }
      }}
      onBatchRestore={
        selectedCategoryId === "trash"
          ? async () => {
              const ids = selectedLinks.map(link => link.id);
              if (ids.length > 0 && batchHandlersRef.current) {
                await batchHandlersRef.current.onBatchRestore(ids);
                clearSelectionRef.current?.();
              }
            }
          : undefined
      }
      onBatchPermanentDelete={
        selectedCategoryId === "trash"
          ? async () => {
              const ids = selectedLinks.map(link => link.id);
              if (ids.length > 0 && batchHandlersRef.current) {
                await batchHandlersRef.current.onBatchPermanentDelete(ids);
                clearSelectionRef.current?.();
              }
            }
          : undefined
      }
      onBatchPin={
        selectedCategoryId !== "trash"
          ? async () => {
              const ids = selectedLinks.map(link => link.id);
              if (ids.length > 0 && batchHandlersRef.current) {
                batchHandlersRef.current.onBatchPin(ids);
                clearSelectionRef.current?.();
              }
            }
          : undefined
      }
      onBatchUnpin={
        selectedCategoryId !== "trash"
          ? async () => {
              const ids = selectedLinks.map(link => link.id);
              if (ids.length > 0 && batchHandlersRef.current) {
                batchHandlersRef.current.onBatchUnpin(ids);
                clearSelectionRef.current?.();
              }
            }
          : undefined
      }
    >
      <Suspense fallback={<LinkListSkeleton />}>
        <DashboardContent
          user={user}
          selectedCategoryId={selectedCategoryId}
          sortBy={sortBy}
          sortOrder={sortOrder}
          isAddingItem={isAddingItem}
          addInputValue={addInputValue}
          onAddInputChange={handleAddInputChange}
          onAddSubmit={handleAddSubmit}
          onAddCancel={handleAddCancel}
          onSelectionChange={handleSelectionChange}
          searchQuery={searchQuery}
          initialLinks={initialLinks}
        />
      </Suspense>
    </DashboardShell>
  );
}
