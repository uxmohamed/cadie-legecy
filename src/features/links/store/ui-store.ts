import { create } from "zustand";

/**
 * UI-only state store
 * 
 * This store contains ONLY ephemeral UI state, not server data.
 * Server data is managed by TanStack Query.
 * 
 * What belongs here:
 * - Selection state
 * - Sort preferences (could also be URL params)
 * - Modal/dialog state
 * - Temporary UI flags
 * 
 * What does NOT belong here:
 * - Links data (use TanStack Query)
 * - Spaces data (use TanStack Query)
 * - Any data that comes from the server
 */
interface UIStoreState {
  // Selection state
  selectedLinkIds: Set<string>;
  
  // Actions
  selectLink: (id: string) => void;
  deselectLink: (id: string) => void;
  toggleLinkSelection: (id: string) => void;
  selectAllLinks: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Reset all UI state (e.g., on logout)
  reset: () => void;
}

const initialState = {
  selectedLinkIds: new Set<string>(),
};

export const useUIStore = create<UIStoreState>((set) => ({
  ...initialState,

  selectLink: (id) =>
    set((state) => ({
      selectedLinkIds: new Set([...state.selectedLinkIds, id]),
    })),

  deselectLink: (id) =>
    set((state) => {
      const next = new Set(state.selectedLinkIds);
      next.delete(id);
      return { selectedLinkIds: next };
    }),

  toggleLinkSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedLinkIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedLinkIds: next };
    }),

  selectAllLinks: (ids) =>
    set(() => ({
      selectedLinkIds: new Set(ids),
    })),

  clearSelection: () =>
    set(() => ({
      selectedLinkIds: new Set(),
    })),

  reset: () => set(initialState),
}));

/**
 * Clear the UI store.
 * Call this when user logs out to prevent state leakage between accounts.
 */
export function clearUIStore(): void {
  useUIStore.getState().reset();
}
