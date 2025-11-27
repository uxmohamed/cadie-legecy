"use client";

import * as React from "react";

import { AddLinkModal } from "@/components/add-link-modal";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { RichTextModal } from "@/components/rich-text-modal";
import { Dock } from "@/components/dock";
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
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const { categories } = useCategories(!!user);

  // Listen for custom event to open add modal
  React.useEffect(() => {
    const handleOpenAddModal = () => setAddModalOpen(true);
    window.addEventListener("openAddModal", handleOpenAddModal);
    return () => window.removeEventListener("openAddModal", handleOpenAddModal);
  }, []);

  const filters = React.useMemo(() => {

    if (selectedCategoryId === "trash") return { is_deleted: true };
    return { is_archived: false };
  }, [selectedCategoryId]);

  const {
    filteredLinks,
    isLoading,
    fetchingLinks,
    handleSearch,
    handleSubmit,
    handleDeleteLink,

    handleCopyUrl,
    handleEditLink,
    handleSaveRichText,
    handlePinLink,
    handleUnpinLink,
    handleBatchDeleteLinks,

  } = useLinks(!!user, filters);

  const onSaveRichText = async (content: SerializedEditorState) => {
    if (!editingLink) return;
    await handleSaveRichText(editingLink, content);
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-l0)]">
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 relative z-30">
          <Logo />
          <UserMenu user={user} />
        </header>
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mx-auto w-full max-w-4xl px-8">
            <div className="sticky top-0 z-20 bg-[var(--bg-l0)] pt-8 pb-4">
              <CaptureInput
                onSearch={handleSearch}
                isLoading={isLoading}
                searchOnly
              />
            </div>
            {fetchingLinks ? (
              <LinkListSkeleton />
            ) : (
              <>
                {selectedCategoryId === "trash" && (
                  <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                    Items in the Trash are permanently deleted after 60 days.
                  </div>
                )}
                <LinkList
                  links={filteredLinks}
                  onDelete={handleDeleteLink}

                  onEdit={handleEditLink}
                  onCopyUrl={handleCopyUrl}
                  onPin={handlePinLink}
                  onUnpin={handleUnpinLink}
                  onBatchDelete={handleBatchDeleteLinks}

                  isTrashView={selectedCategoryId === "trash"}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <AddLinkModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      <Dock
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        onAddClick={() => setAddModalOpen(true)}
      />
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
