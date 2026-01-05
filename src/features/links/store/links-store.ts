import { create } from "zustand";
import type { Link } from "@/features/links/types";

type LinksView = "all" | "trash";

interface LinksStateByView {
  links: Link[];
  total: number;
}

interface LinksStoreState {
  all: LinksStateByView;
  trash: LinksStateByView;
  isHydrated: boolean;

  hydrate: (view: LinksView, payload: LinksStateByView) => void;
  setFromSWR: (view: LinksView, payload: LinksStateByView) => void;

  addLink: (link: Link) => void;
  updateLink: (id: string, updates: Partial<Link>) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentDelete: (id: string) => void;

  applyRealtimeInsertOrUpdate: (link: Link) => void;
  applyRealtimeDelete: (link: Link) => void;

  batchMoveToTrash: (ids: string[]) => void;
  batchRestoreFromTrash: (ids: string[]) => void;
  batchPermanentDelete: (ids: string[]) => void;
  batchUpdateLink: (ids: string[], updates: Partial<Link>) => void;
}

function classifyView(link: Link): LinksView | null {
  if (link.is_deleted) return "trash";
  if (!link.is_archived) return "all";
  return null;
}

function sortLinks(links: Link[]): Link[] {
  // Pinned first, then by created_at desc
  return [...links].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });
}

function upsertLinkArray(links: Link[], link: Link): Link[] {
  const existingIndex = links.findIndex((l) => l.id === link.id);
  if (existingIndex === -1) {
    return sortLinks([link, ...links]);
  }
  const next = [...links];
  next[existingIndex] = link;
  return sortLinks(next);
}

function removeFromArray(links: Link[], id: string): Link[] {
  return links.filter((l) => l.id !== id);
}

export const useLinksStore = create<LinksStoreState>((set, get) => ({
  all: { links: [], total: 0 },
  trash: { links: [], total: 0 },
  isHydrated: false,

  hydrate(view, payload) {
    set((state) => {
      const nextViewState: LinksStateByView = {
        links: sortLinks(payload.links),
        total: payload.total,
      };

      if (view === "all") {
        return {
          ...state,
          all: nextViewState,
          isHydrated: true,
        };
      }

      return {
        ...state,
        trash: nextViewState,
        isHydrated: true,
      };
    });
  },

  setFromSWR(view, payload) {
    set((state) => {
      const nextViewState: LinksStateByView = {
        links: sortLinks(payload.links),
        total: payload.total,
      };

      if (view === "all") {
        return {
          ...state,
          all: nextViewState,
        };
      }

      return {
        ...state,
        trash: nextViewState,
      };
    });
  },

  addLink(link) {
    const view = classifyView(link);
    if (!view) return;

    set((state) => {
      const target = state[view];
      return {
        ...state,
        [view]: {
          links: upsertLinkArray(target.links, link),
          total: target.total + 1,
        },
      };
    });
  },

  updateLink(id, updates) {
    set((state) => {
      const allUpdated = state.all.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      );
      const trashUpdated = state.trash.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link,
      );

      return {
        ...state,
        all: { ...state.all, links: sortLinks(allUpdated) },
        trash: { ...state.trash, links: sortLinks(trashUpdated) },
      };
    });
  },

  moveToTrash(id) {
    set((state) => {
      const linkInAll = state.all.links.find((l) => l.id === id);
      const updatedAllLinks = removeFromArray(state.all.links, id);
      const updatedTrashLinks =
        linkInAll != null
          ? upsertLinkArray(state.trash.links, { ...linkInAll, is_deleted: true })
          : state.trash.links;

      return {
        ...state,
        all: {
          links: updatedAllLinks,
          total: Math.max(0, state.all.total - 1),
        },
        trash: {
          links: updatedTrashLinks,
          total: state.trash.total + (linkInAll ? 1 : 0),
        },
      };
    });
  },

  restoreFromTrash(id) {
    set((state) => {
      const linkInTrash = state.trash.links.find((l) => l.id === id);
      const updatedTrashLinks = removeFromArray(state.trash.links, id);
      const updatedAllLinks =
        linkInTrash != null
          ? upsertLinkArray(state.all.links, { ...linkInTrash, is_deleted: false, is_archived: false })
          : state.all.links;

      return {
        ...state,
        all: {
          links: updatedAllLinks,
          total: state.all.total + (linkInTrash ? 1 : 0),
        },
        trash: {
          links: updatedTrashLinks,
          total: Math.max(0, state.trash.total - (linkInTrash ? 1 : 0)),
        },
      };
    });
  },

  permanentDelete(id) {
    set((state) => {
      const hadInTrash = state.trash.links.some((l) => l.id === id);
      return {
        ...state,
        trash: {
          links: removeFromArray(state.trash.links, id),
          total: Math.max(0, state.trash.total - (hadInTrash ? 1 : 0)),
        },
        all: {
          ...state.all,
          links: removeFromArray(state.all.links, id),
        },
      };
    });
  },

  applyRealtimeInsertOrUpdate(link) {
    const targetView = classifyView(link);
    set((state) => {
      const nextState: LinksStoreState = {
        ...state,
        all: { ...state.all },
        trash: { ...state.trash },
      };

      // Remove from both views first to avoid duplicates
      nextState.all.links = removeFromArray(nextState.all.links, link.id);
      nextState.trash.links = removeFromArray(nextState.trash.links, link.id);

      if (targetView === "all") {
        nextState.all.links = upsertLinkArray(nextState.all.links, link);
      } else if (targetView === "trash") {
        nextState.trash.links = upsertLinkArray(nextState.trash.links, link);
      }

      // Recalculate totals based on arrays to keep them consistent
      nextState.all.total = nextState.all.links.length;
      nextState.trash.total = nextState.trash.links.length;

      return nextState;
    });
  },

  applyRealtimeDelete(link) {
    const view = classifyView(link);
    set((state) => {
      const nextAllLinks = removeFromArray(state.all.links, link.id);
      const nextTrashLinks = removeFromArray(state.trash.links, link.id);

      return {
        ...state,
        all: {
          links: nextAllLinks,
          total: view === "all" ? Math.max(0, state.all.total - 1) : state.all.total,
        },
        trash: {
          links: nextTrashLinks,
          total: view === "trash" ? Math.max(0, state.trash.total - 1) : state.trash.total,
        },
      };
    });
  },

  batchMoveToTrash(ids) {
    set((state) => {
      const linksToMove = state.all.links.filter((l) => ids.includes(l.id));
      const updatedAllLinks = state.all.links.filter((l) => !ids.includes(l.id));
      const updatedTrashLinks = [
        ...linksToMove.map((l) => ({ ...l, is_deleted: true })),
        ...state.trash.links.filter((l) => !ids.includes(l.id)),
      ];

      return {
        ...state,
        all: {
          links: updatedAllLinks,
          total: Math.max(0, state.all.total - linksToMove.length),
        },
        trash: {
          links: sortLinks(updatedTrashLinks),
          total: state.trash.total + linksToMove.length,
        },
      };
    });
  },

  batchRestoreFromTrash(ids) {
    set((state) => {
      const linksToRestore = state.trash.links.filter((l) => ids.includes(l.id));
      const updatedTrashLinks = state.trash.links.filter((l) => !ids.includes(l.id));
      const updatedAllLinks = [
        ...linksToRestore.map((l) => ({ ...l, is_deleted: false, is_archived: false })),
        ...state.all.links.filter((l) => !ids.includes(l.id)),
      ];

      return {
        ...state,
        all: {
          links: sortLinks(updatedAllLinks),
          total: state.all.total + linksToRestore.length,
        },
        trash: {
          links: updatedTrashLinks,
          total: Math.max(0, state.trash.total - linksToRestore.length),
        },
      };
    });
  },

  batchPermanentDelete(ids) {
    set((state) => {
      const hadInTrash = state.trash.links.filter((l) => ids.includes(l.id));
      const hadInAll = state.all.links.filter((l) => ids.includes(l.id));

      return {
        ...state,
        all: {
          links: state.all.links.filter((l) => !ids.includes(l.id)),
          total: Math.max(0, state.all.total - hadInAll.length),
        },
        trash: {
          links: state.trash.links.filter((l) => !ids.includes(l.id)),
          total: Math.max(0, state.trash.total - hadInTrash.length),
        },
      };
    });
  },

  batchUpdateLink(ids, updates) {
    set((state) => {
      const allUpdated = state.all.links.map((link) =>
        ids.includes(link.id) ? { ...link, ...updates } : link,
      );
      const trashUpdated = state.trash.links.map((link) =>
        ids.includes(link.id) ? { ...link, ...updates } : link,
      );

      return {
        ...state,
        all: { ...state.all, links: sortLinks(allUpdated) },
        trash: { ...state.trash, links: sortLinks(trashUpdated) },
      };
    });
  },
}));

export function selectLinksForView(state: LinksStoreState, view: LinksView): LinksStateByView {
  return view === "trash" ? state.trash : state.all;
}

