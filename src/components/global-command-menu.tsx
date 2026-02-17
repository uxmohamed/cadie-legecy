"use client";

import * as React from "react";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconLayoutGrid,
  IconLayoutList,
  IconHelp,
  IconArrowsSort,
  IconFolder,
  IconPalette,
  IconPhoto,
  IconFileTypePdf,
} from "@tabler/icons-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { Space } from "@/types";

interface GlobalCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTrashView: boolean;
  viewMode: "list" | "grid";
  spaces?: Space[];
  selectedCategoryId: string | null;
  onOpenAddMode: (initialValue?: string) => void;
  onViewChange: (view: string | null) => void;
  onViewModeChange: (mode: "list" | "grid") => void;
  onSortChange: (sortBy: "date" | "title") => void;
  onToggleHelp: () => void;
  onUploadImagesClick?: () => void;
  onUploadDocumentsClick?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function GlobalCommandMenu({
  open,
  onOpenChange,
  isTrashView,
  viewMode,
  spaces,
  selectedCategoryId,
  onOpenAddMode,
  onViewChange,
  onViewModeChange,
  onSortChange,
  onToggleHelp,
  onUploadImagesClick,
  onUploadDocumentsClick,
  searchQuery,
  onSearchChange,
}: GlobalCommandMenuProps) {
  const [query, setQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    if (!open) {
      setQuery(searchQuery);
      return;
    }

    setQuery(searchQuery);
  }, [open, searchQuery]);

  const runCommand = React.useCallback(
    (action: () => void) => {
      action();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  const handleValueChange = React.useCallback(
    (value: string) => {
      setQuery(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const matchesQuery = React.useCallback(
    (...tokens: string[]) => {
      if (!hasQuery) return true;
      return tokens.some((token) => token.toLowerCase().includes(normalizedQuery));
    },
    [hasQuery, normalizedQuery]
  );

  const showSearchAction = hasQuery;
  const showCreateLink = !isTrashView && matchesQuery("add link", "create link", "new link", "n");
  const showCreateColor = !isTrashView && matchesQuery("add color", "create color");
  const showUploadImage = !isTrashView && Boolean(onUploadImagesClick) && matchesQuery("upload image", "image");
  const showUploadDocument =
    !isTrashView && Boolean(onUploadDocumentsClick) && matchesQuery("upload pdf", "upload document", "document", "pdf");
  const showCreateGroup = showCreateLink || showCreateColor || showUploadImage || showUploadDocument;

  const showToggleView = matchesQuery("toggle view", "grid", "list", "view", "v");
  const showShortcuts = matchesQuery("keyboard shortcuts", "help", "shortcuts", "cmd/");
  const showGeneralGroup = showToggleView || showShortcuts;

  const showSortByDate = matchesQuery("sort by date", "sort", "date");
  const showSortByName = matchesQuery("sort by name", "sort", "name", "title");
  const showSortGroup = showSortByDate || showSortByName;

  const showGoAllItems = matchesQuery("go to all items", "all items", "all");
  const showGoTrash = matchesQuery("go to trash", "trash");
  const visibleSpaces = (spaces ?? []).filter((space) =>
    matchesQuery("go to space", "navigate", "folder", space.name)
  );
  const showNavigateGroup = showGoAllItems || showGoTrash || visibleSpaces.length > 0;

  const hasVisibleItems =
    showSearchAction ||
    showCreateGroup ||
    showGeneralGroup ||
    showSortGroup ||
    showNavigateGroup;

  const showSeparatorAfterCreate = showCreateGroup && (showGeneralGroup || showSortGroup || showNavigateGroup);
  const showSeparatorAfterGeneral = showGeneralGroup && (showSortGroup || showNavigateGroup);
  const showSeparatorAfterSort = showSortGroup && showNavigateGroup;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} commandProps={{ value: query, onValueChange: handleValueChange }}>
      <CommandInput placeholder="Type to search links, colors, files, or run actions..." />
      <CommandList>
        {!hasVisibleItems && <CommandEmpty>No matching result.</CommandEmpty>}

        {showSearchAction && (
          <CommandGroup heading="Search">
            <CommandItem onSelect={() => runCommand(() => onSearchChange(query))}>
              <IconSearch className="mr-2 h-4 w-4" />
              Search for “{query}”
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {showCreateGroup && (
          <CommandGroup heading="Create">
            {showCreateLink && (
              <CommandItem onSelect={() => runCommand(() => onOpenAddMode(query || undefined))}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add link
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
            )}
            {showCreateColor && (
              <CommandItem onSelect={() => runCommand(() => onOpenAddMode(query || undefined))}>
                <IconPalette className="mr-2 h-4 w-4" />
                Add color
              </CommandItem>
            )}
            {showUploadImage && onUploadImagesClick && (
              <CommandItem onSelect={() => runCommand(onUploadImagesClick)}>
                <IconPhoto className="mr-2 h-4 w-4" />
                Upload image
              </CommandItem>
            )}
            {showUploadDocument && onUploadDocumentsClick && (
              <CommandItem onSelect={() => runCommand(onUploadDocumentsClick)}>
                <IconFileTypePdf className="mr-2 h-4 w-4" />
                Upload PDF
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {showSeparatorAfterCreate && <CommandSeparator />}

        {showGeneralGroup && (
          <CommandGroup heading="General">
            {showToggleView && (
              <CommandItem onSelect={() => runCommand(() => onViewModeChange(viewMode === "list" ? "grid" : "list"))}>
                {viewMode === "list" ? <IconLayoutGrid className="mr-2 h-4 w-4" /> : <IconLayoutList className="mr-2 h-4 w-4" />}
                Toggle {viewMode === "list" ? "grid" : "list"} view
                <CommandShortcut>V</CommandShortcut>
              </CommandItem>
            )}
            {showShortcuts && (
              <CommandItem onSelect={() => runCommand(onToggleHelp)}>
                <IconHelp className="mr-2 h-4 w-4" />
                Show keyboard shortcuts
                <CommandShortcut>⌘/</CommandShortcut>
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {showSeparatorAfterGeneral && <CommandSeparator />}

        {showSortGroup && (
          <CommandGroup heading="Sort">
            {showSortByDate && (
              <CommandItem onSelect={() => runCommand(() => onSortChange("date"))}>
                <IconArrowsSort className="mr-2 h-4 w-4" />
                Sort by date
              </CommandItem>
            )}
            {showSortByName && (
              <CommandItem onSelect={() => runCommand(() => onSortChange("title"))}>
                <IconArrowsSort className="mr-2 h-4 w-4" />
                Sort by name
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {showSeparatorAfterSort && <CommandSeparator />}

        {showNavigateGroup && (
          <CommandGroup heading="Navigate">
            {showGoAllItems && (
              <CommandItem onSelect={() => runCommand(() => onViewChange(null))}>
                <IconFolder className="mr-2 h-4 w-4" />
                Go to All items
                {selectedCategoryId === null && <CommandShortcut>Current</CommandShortcut>}
              </CommandItem>
            )}
            {showGoTrash && (
              <CommandItem onSelect={() => runCommand(() => onViewChange("trash"))}>
                <IconTrash className="mr-2 h-4 w-4" />
                Go to Trash
                {isTrashView && <CommandShortcut>Current</CommandShortcut>}
              </CommandItem>
            )}
            {visibleSpaces.map((space) => (
              <CommandItem key={space.id} onSelect={() => runCommand(() => onViewChange(space.id))}>
                <IconFolder className="mr-2 h-4 w-4" />
                Go to {space.name}
                {selectedCategoryId === space.id && <CommandShortcut>Current</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
