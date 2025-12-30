"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardContent } from "@/components/dashboard-content";
import { LinkListSkeleton } from "@/components/skeletons";
import { OnboardingFlow } from "@/components/onboarding";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";

interface DashboardClientProps {
  user: User;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [profileChecked, setProfileChecked] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  const [addInputValue, setAddInputValue] = React.useState("");
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [selectedLinks, setSelectedLinks] = React.useState<Link[]>([]);
  const clearSelectionRef = React.useRef<(() => void) | null>(null);

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

  const handleAddInputChange = React.useCallback((value: string) => {
    setAddInputValue(value);
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
    (count: number, links: Link[], clearSelection: () => void) => {
      setSelectedCount(count);
      setSelectedLinks(links);
      clearSelectionRef.current = clearSelection;
    },
    []
  );

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
      onViewChange={setSelectedCategoryId}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
      isAddingItem={isAddingItem}
      onToggleAddMode={handleToggleAddMode}
      selectedCount={selectedCount}
      selectedLinks={selectedLinks}
      onClearSelection={() => clearSelectionRef.current?.()}
      onBatchDelete={async () => {
        // Handler will be called from DashboardContent
      }}
      onBatchRestore={
        selectedCategoryId === "trash"
          ? async () => {
              // Handler will be called from DashboardContent
            }
          : undefined
      }
      onBatchPermanentDelete={
        selectedCategoryId === "trash"
          ? async () => {
              // Handler will be called from DashboardContent
            }
          : undefined
      }
      onBatchPin={
        selectedCategoryId !== "trash"
          ? async () => {
              // Handler will be called from DashboardContent
            }
          : undefined
      }
      onBatchUnpin={
        selectedCategoryId !== "trash"
          ? async () => {
              // Handler will be called from DashboardContent
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
        />
      </Suspense>
    </DashboardShell>
  );
}
