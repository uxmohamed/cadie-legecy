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
  onSearchSubmit: (value: string) => void;
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
  onSearchSubmit,
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

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} commandProps={{ value: query, onValueChange: handleValueChange }}>
      <CommandInput placeholder="Type to search links, colors, files, or run actions..." />
      <CommandList>
        <CommandEmpty>No matching result.</CommandEmpty>

        {hasQuery && (
          <CommandGroup heading="Search">
            <CommandItem onSelect={() => runCommand(() => onSearchSubmit(query))}>
              <IconSearch className="mr-2 h-4 w-4" />
              Search for “{query}”
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="Create">
          {!isTrashView && (
            <>
              <CommandItem onSelect={() => runCommand(() => onOpenAddMode(query || undefined))}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add link
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => onOpenAddMode(query || undefined))}>
                <IconPalette className="mr-2 h-4 w-4" />
                Add color
              </CommandItem>
              {onUploadImagesClick && (
                <CommandItem onSelect={() => runCommand(onUploadImagesClick)}>
                  <IconPhoto className="mr-2 h-4 w-4" />
                  Upload image
                </CommandItem>
              )}
              {onUploadDocumentsClick && (
                <CommandItem onSelect={() => runCommand(onUploadDocumentsClick)}>
                  <IconFileTypePdf className="mr-2 h-4 w-4" />
                  Upload PDF
                </CommandItem>
              )}
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="General">
          <CommandItem onSelect={() => runCommand(() => onViewModeChange(viewMode === "list" ? "grid" : "list"))}>
            {viewMode === "list" ? <IconLayoutGrid className="mr-2 h-4 w-4" /> : <IconLayoutList className="mr-2 h-4 w-4" />}
            Toggle {viewMode === "list" ? "grid" : "list"} view
            <CommandShortcut>V</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(onToggleHelp)}>
            <IconHelp className="mr-2 h-4 w-4" />
            Show keyboard shortcuts
            <CommandShortcut>⌘/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Sort">
          <CommandItem onSelect={() => runCommand(() => onSortChange("date"))}>
            <IconArrowsSort className="mr-2 h-4 w-4" />
            Sort by date
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onSortChange("title"))}>
            <IconArrowsSort className="mr-2 h-4 w-4" />
            Sort by name
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => onViewChange(null))}>
            <IconFolder className="mr-2 h-4 w-4" />
            Go to All items
            {selectedCategoryId === null && <CommandShortcut>Current</CommandShortcut>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onViewChange("trash"))}>
            <IconTrash className="mr-2 h-4 w-4" />
            Go to Trash
            {isTrashView && <CommandShortcut>Current</CommandShortcut>}
          </CommandItem>
          {spaces?.map((space) => (
            <CommandItem key={space.id} onSelect={() => runCommand(() => onViewChange(space.id))}>
              <IconFolder className="mr-2 h-4 w-4" />
              Go to {space.name}
              {selectedCategoryId === space.id && <CommandShortcut>Current</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
