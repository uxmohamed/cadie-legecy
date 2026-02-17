"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardContent } from "@/components/dashboard-content";
import { LinkListSkeleton } from "@/components/skeletons";
import { useRealtimeSync } from "@/features/links/hooks/use-realtime-sync.hook";
import { useSpaces } from "@/features/spaces/queries";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const SpaceModal = dynamic(
  () => import("@/components/spaces/space-modal").then((mod) => mod.SpaceModal),
  { ssr: false }
);
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";
import { NoteEditorModal } from "@/components/note-editor-modal";

interface DashboardClientProps {
  user: User;
  initialView?: "trash" | string | null; // "trash" for trash view, string for space ID, null for all items
  initialSpaces?: Space[];
}

export function DashboardClient({ user, initialView = null, initialSpaces }: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine view from URL path or initialView prop
  const isTrashRoute = pathname === "/trash" || initialView === "trash";
  const isSpaceRoute = pathname.startsWith("/space/");
  const spaceIdFromPath = isSpaceRoute ? pathname.split("/space/")[1] : null;
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    isTrashRoute ? "trash" : (initialView || spaceIdFromPath || null)
  );
  
  // Always start as "list" to match SSR, then sync from localStorage after hydration
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");

  React.useEffect(() => {
    const stored = localStorage.getItem("cadie-view-mode") as "list" | "grid" | null;
    if (stored && stored !== "list") {
      setViewMode(stored);
    }
  }, []);
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
    onBatchAddToSpace: (spaceId: string, ids: string[]) => Promise<void>;
  } | null>(null);
  
  // Spaces management
  const { spaces, createSpace, updateSpace, deleteSpace } = useSpaces(!!user, initialSpaces);
  const [spaceModalOpen, setSpaceModalOpen] = React.useState(false);
  const [editingSpace, setEditingSpace] = React.useState<Space | null>(null);
  const imageUploadHandlerRef = React.useRef<((files: File[]) => void) | null>(null);
  const documentUploadHandlerRef = React.useRef<((files: File[]) => void) | null>(null);
  const createNoteHandlerRef = React.useRef<((payload: { title: string; html: string; plainText: string }) => Promise<unknown>) | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  
  // Sync selectedCategoryId with URL path changes
  React.useEffect(() => {
    if (pathname === "/trash") {
      setSelectedCategoryId("trash");
    } else if (pathname === "/") {
      setSelectedCategoryId(null);
    } else if (pathname.startsWith("/space/")) {
      const spaceId = pathname.split("/space/")[1];
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(spaceId)) {
        setSelectedCategoryId(spaceId);
      }
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


  const handleOpenAddMode = React.useCallback((initialValue?: string) => {
    if (selectedCategoryId === "trash") return;
    if (initialValue) {
      setAddInputValue(initialValue);
    }
    setIsAddingItem(true);
  }, [selectedCategoryId]);

  const handleAddInputChange = React.useCallback((value: string) => {
    setAddInputValue(value);
  }, []);

  const handleViewModeChange = React.useCallback((mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("cadie-view-mode", mode);
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
      onBatchAddToSpace: (spaceId: string, ids: string[]) => Promise<void>;
    }) => {
      setSelectedCount(count);
      setSelectedLinks(links);
      clearSelectionRef.current = clearSelection;
      batchHandlersRef.current = batchHandlers;
    },
    []
  );

  // Initialize realtime sync - keeps store updated with database changes
  useRealtimeSync(!!user, user.id);

  // Handle view change with non-blocking navigation
  const handleViewChange = React.useCallback((categoryId: string | null) => {
    let targetPath: string;
    
    if (categoryId === "trash") {
      targetPath = "/trash";
    } else if (categoryId && categoryId !== "trash") {
      // Space ID - navigate to /space/[id]
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(categoryId)) {
        targetPath = `/space/${categoryId}`;
      } else {
        // Fallback to home if invalid
        targetPath = "/";
      }
    } else {
      targetPath = "/";
    }
    
    // Update state immediately for instant UI switch
    setSelectedCategoryId(categoryId);
    
    // Navigate to the target path
    router.push(targetPath);
  }, [router]);
  
  const handleImageUploadReady = React.useCallback((handler: (files: File[]) => void) => {
    imageUploadHandlerRef.current = handler;
  }, []);

  const handleUploadImages = React.useCallback((files: File[]) => {
    imageUploadHandlerRef.current?.(files);
  }, []);

  const handleDocumentUploadReady = React.useCallback((handler: (files: File[]) => void) => {
    documentUploadHandlerRef.current = handler;
  }, []);

  const handleUploadDocuments = React.useCallback((files: File[]) => {
    documentUploadHandlerRef.current?.(files);
  }, []);

  const handleCreateNoteReady = React.useCallback((handler: (payload: { title: string; html: string; plainText: string }) => Promise<unknown>) => {
    createNoteHandlerRef.current = handler;
  }, []);

  const handleCreateNote = React.useCallback(() => {
    setIsNoteModalOpen(true);
  }, []);

  const handleSaveNote = React.useCallback(async (payload: { title: string; html: string; plainText: string }) => {
    await createNoteHandlerRef.current?.(payload);
  }, []);

  const handleCreateSpace = React.useCallback(() => {
    setEditingSpace(null);
    setSpaceModalOpen(true);
  }, []);

  const handleEditSpace = React.useCallback((space: Space) => {
    setEditingSpace(space);
    setSpaceModalOpen(true);
  }, []);
  
  const handleSaveSpace = React.useCallback(async (name: string, color: string) => {
    if (editingSpace) {
      await updateSpace(editingSpace.id, { name, color });
    } else {
      await createSpace(name, color);
    }
  }, [editingSpace, createSpace, updateSpace]);
  
  const handleDeleteSpace = React.useCallback(async (id: string) => {
    await deleteSpace(id);
    // If deleted space was selected, switch to all items
    if (selectedCategoryId === id) {
      handleViewChange(null);
    }
  }, [deleteSpace, selectedCategoryId, handleViewChange]);

  return (
    <>
      <DashboardShell
        user={user}
        selectedCategoryId={selectedCategoryId}
        onViewChange={handleViewChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        spaces={spaces}
        onCreateSpace={handleCreateSpace}
        onEditSpace={handleEditSpace}
        onDeleteSpace={handleDeleteSpace}
        onUploadImages={handleUploadImages}
        onUploadDocuments={handleUploadDocuments}
        onCreateNote={handleCreateNote}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={handleSortChange}
      isAddingItem={isAddingItem}
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
      onBatchCopyLinks={
        selectedCategoryId !== "trash"
          ? async () => {
              const urls = selectedLinks
                .map((link) => link.url?.trim())
                .filter((url): url is string => Boolean(url));
              if (urls.length === 0) {
                toast.error("No links to copy");
                return;
              }

              try {
                await navigator.clipboard.writeText(urls.join("\n"));
                toast.success(urls.length === 1 ? "Link copied to clipboard" : `${urls.length} links copied to clipboard`);
              } catch {
                toast.error("Failed to copy links");
              }
            }
          : undefined
      }
      onBatchMoveToSpace={
        selectedCategoryId !== "trash"
          ? async (spaceId: string) => {
              const ids = selectedLinks.map((link) => link.id);
              if (ids.length > 0 && batchHandlersRef.current) {
                await batchHandlersRef.current.onBatchAddToSpace(spaceId, ids);
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
          viewMode={viewMode}
          onImageUploadReady={handleImageUploadReady}
          onDocumentUploadReady={handleDocumentUploadReady}
          onCreateNoteReady={handleCreateNoteReady}
        />
      </Suspense>
    </DashboardShell>

    <NoteEditorModal
      open={isNoteModalOpen}
      onOpenChange={setIsNoteModalOpen}
      onSave={handleSaveNote}
    />

    <SpaceModal
      open={spaceModalOpen}
      onOpenChange={setSpaceModalOpen}
      space={editingSpace}
      onSave={handleSaveSpace}
      onDelete={editingSpace ? handleDeleteSpace : undefined}
    />
    </>
  );
}
