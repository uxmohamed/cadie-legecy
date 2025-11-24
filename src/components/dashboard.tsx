"use client";

import * as React from "react";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { RichTextModal } from "@/components/rich-text-modal";
import { Sidebar } from "@/components/sidebar";
import { useCategories } from "@/hooks/use-categories";
import { useShortcuts } from "@/components/shortcut-context";
import { useLinks } from "@/features/links/hooks";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/features/links/types";
import type { SerializedEditorState } from "lexical";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [richTextModalOpen, setRichTextModalOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<Link | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { categories } = useCategories(!!user);
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  // Register sidebar toggle shortcut
  React.useEffect(() => {
    registerShortcut({
      key: "[",
      description: "Toggle sidebar",
      category: "Global",
      action: () => setSidebarOpen((prev) => !prev),
    });

    return () => {
      unregisterShortcut("[");
    };
  }, [registerShortcut, unregisterShortcut]);

  const filters = React.useMemo(() => {
    if (selectedCategoryId === "archive") return { is_archived: true };
    if (selectedCategoryId === "trash") return { is_deleted: true };
    if (selectedCategoryId) return { category_id: selectedCategoryId, is_archived: false };
    return { is_archived: false };
  }, [selectedCategoryId]);

  const {
    filteredLinks,
    isLoading,
    fetchingLinks,
    handleSearch,
    handleSubmit,
    handleDeleteLink,
    handleArchiveLink,
    handleCopyUrl,
    handleEditLink,
    handleSaveRichText,
    handlePinLink,
    handleUnpinLink,
    handleBatchDeleteLinks,
    handleBatchArchiveLinks,
    reorderLinks,
  } = useLinks(!!user, filters);

  const onSaveRichText = async (content: SerializedEditorState) => {
    if (!editingLink) return;
    await handleSaveRichText(editingLink, content);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="hidden md:block">
          <Sidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>
      )}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 relative z-30">
          <Logo />
          <UserMenu user={user} />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-8">
            <div className="sticky top-0 z-20 bg-[#fafafa] pt-8 pb-4">
              <CaptureInput
                onSubmit={handleSubmit}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <LinkList
                links={filteredLinks}
                onDelete={handleDeleteLink}
                onArchive={handleArchiveLink}
                onEdit={handleEditLink}
                onCopyUrl={handleCopyUrl}
                onPin={handlePinLink}
                onUnpin={handleUnpinLink}
                onBatchDelete={handleBatchDeleteLinks}
                onBatchArchive={handleBatchArchiveLinks}
                onReorder={reorderLinks}
              />
            )}
          </div>
        </div>
      </main>
      {editingLink && (
        <RichTextModal
          isOpen={richTextModalOpen}
          onClose={() => {
            setRichTextModalOpen(false);
            setEditingLink(null);
          }}
          onSave={onSaveRichText}
          initialContent={
            (editingLink.rich_text_content as SerializedEditorState | null) ||
            undefined
          }
          linkId={editingLink.id}
        />
      )}
    </div>
  );
}
