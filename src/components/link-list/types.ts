import type { Link } from "@/features/links/types";

export interface LinkListProps {
  links: Link[];
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onEdit?: (link: Link) => void;
  onCopyUrl?: (url: string) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onUpdateLink?: (id: string, updates: Partial<Link>) => Promise<void>;
  onBatchDelete?: (ids: string[]) => Promise<void> | void;
  onBatchRestore?: (ids: string[]) => Promise<void> | void;
  onBatchPermanentDelete?: (ids: string[]) => Promise<void> | void;
  onBatchPin?: (ids: string[]) => Promise<void> | void;
  onBatchUnpin?: (ids: string[]) => Promise<void> | void;
  onBatchAddToSpace?: (spaceId: string, ids: string[]) => Promise<void> | void;

  isTrashView?: boolean;

  // Inline add mode props
  isAddingItem?: boolean;
  addInputValue?: string;
  onAddInputChange?: (value: string) => void;
  onAddSubmit?: () => void;
  onAddCancel?: () => void;

  // Inline edit mode props
  editingLinkId?: string | null;
  editMode?: 'title' | 'url' | null;
  editValue?: string;
  onRename?: (link: Link) => void;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
}

export interface SelectionState {
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  lastSelectedIndex: number | null;
  setLastSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStartIndex: number | null;
  setDragStartIndex: React.Dispatch<React.SetStateAction<number | null>>;
  dragCurrentIndex: number | null;
  setDragCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
  clearSelection: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  link: Link;
}
