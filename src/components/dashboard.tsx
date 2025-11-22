"use client";

import * as React from "react";
import { CaptureInput } from "@/components/capture-input";
import { LinkList } from "@/components/link-list";
import { LinkListSkeleton } from "@/components/link-list-skeleton";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { RichTextModal } from "@/components/rich-text-modal";
import { useLinks } from "@/hooks/use-links";
import type { User } from "@supabase/supabase-js";
import type { Link } from "@/types";
import type { SerializedEditorState } from "lexical";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [richTextModalOpen, setRichTextModalOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<Link | null>(null);

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
  } = useLinks(!!user);

  const onSaveRichText = async (content: SerializedEditorState) => {
    if (!editingLink) return;
    await handleSaveRichText(editingLink, content);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 relative z-30">
          <Logo className="text-neutral-200" />
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
