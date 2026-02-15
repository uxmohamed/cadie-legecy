"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Space } from "@/types";
import { queryKeys } from "@/lib/query/keys";

/**
 * Response type from the spaces API
 */
interface SpacesResponse {
  spaces: Space[];
}

/**
 * Fetch spaces from API
 */
async function fetchSpaces(): Promise<SpacesResponse> {
  const response = await fetch("/api/spaces");

  if (!response.ok) {
    let errorMessage = "Failed to fetch spaces";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.userMessage ?? errorData.error ?? errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Hook for fetching spaces using TanStack Query
 * 
 * Features:
 * - Automatic caching with IndexedDB persistence
 * - 5 minute stale time (spaces rarely change)
 * - Background revalidation
 * - Optimistic updates via mutations
 */
export function useSpacesQuery(enabled: boolean = true, initialSpaces?: Space[]) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.spaces.list(),
    queryFn: fetchSpaces,
    enabled,
    initialData: initialSpaces ? { spaces: initialSpaces } : undefined,
    // Spaces are relatively stable - 5 minute stale time
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    // Don't refetch on window focus (spaces rarely change)
    refetchOnWindowFocus: false,
  });

  return {
    spaces: query.data?.spaces ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    queryClient,
  };
}

/**
 * Hook for space mutations with optimistic updates
 */
export function useSpaceMutations() {
  const queryClient = useQueryClient();

  /**
   * Create space
   */
  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to create space");
      }

      const data = await response.json();
      return data.space as Space;
    },
    onMutate: async ({ name, color }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.all });
      const previousData = queryClient.getQueryData<SpacesResponse>(queryKeys.spaces.list());

      // Optimistic update with temporary ID
      const tempSpace: Space = {
        id: `temp-${Date.now()}`,
        user_id: "",
        name,
        color,
        sort_order: (previousData?.spaces.length ?? 0),
        link_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: [...(old?.spaces ?? []), tempSpace],
      }));

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.spaces.list(), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to create space");
    },
    onSuccess: (newSpace) => {
      // Replace temp space with real one
      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.map((s) =>
          s.id.startsWith("temp-") ? newSpace : s
        ) ?? [newSpace],
      }));
      toast.success("Space created");
    },
  });

  /**
   * Update space
   */
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; color?: string; sort_order?: number };
    }) => {
      const response = await fetch(`/api/spaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to update space");
      }

      const data = await response.json();
      return data.space as Space;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.all });
      const previousData = queryClient.getQueryData<SpacesResponse>(queryKeys.spaces.list());

      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ) ?? [],
      }));

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.spaces.list(), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to update space");
    },
    onSuccess: (updatedSpace) => {
      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.map((s) =>
          s.id === updatedSpace.id ? updatedSpace : s
        ) ?? [],
      }));
    },
  });

  /**
   * Delete space
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/spaces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to delete space");
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.all });
      const previousData = queryClient.getQueryData<SpacesResponse>(queryKeys.spaces.list());

      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.filter((s) => s.id !== id) ?? [],
      }));

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.spaces.list(), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete space");
    },
    onSuccess: () => {
      toast.success("Space deleted");
    },
  });

  /**
   * Add links to space
   */
  const addLinksMutation = useMutation({
    mutationFn: async ({ spaceId, linkIds }: { spaceId: string; linkIds: string[] }) => {
      const response = await fetch(`/api/spaces/${spaceId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_ids: linkIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to add links to space");
      }

      return { spaceId, count: linkIds.length };
    },
    onMutate: async ({ spaceId, linkIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.all });
      const previousData = queryClient.getQueryData<SpacesResponse>(queryKeys.spaces.list());

      // Optimistically update link count
      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.map((s) =>
          s.id === spaceId ? { ...s, link_count: s.link_count + linkIds.length } : s
        ) ?? [],
      }));

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.spaces.list(), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to add links to space");
    },
    onSuccess: () => {
      // Invalidate link-spaces cache
      queryClient.invalidateQueries({ queryKey: queryKeys.linkSpaces.all });
    },
  });

  /**
   * Remove links from space
   */
  const removeLinksMutation = useMutation({
    mutationFn: async ({ spaceId, linkIds }: { spaceId: string; linkIds: string[] }) => {
      const response = await fetch(`/api/spaces/${spaceId}/links`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_ids: linkIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? "Failed to remove links from space");
      }

      return { spaceId, count: linkIds.length };
    },
    onMutate: async ({ spaceId, linkIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.all });
      const previousData = queryClient.getQueryData<SpacesResponse>(queryKeys.spaces.list());

      // Optimistically update link count
      queryClient.setQueryData<SpacesResponse>(queryKeys.spaces.list(), (old) => ({
        spaces: old?.spaces.map((s) =>
          s.id === spaceId ? { ...s, link_count: Math.max(0, s.link_count - linkIds.length) } : s
        ) ?? [],
      }));

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.spaces.list(), context.previousData);
      }
      toast.error(err instanceof Error ? err.message : "Failed to remove links from space");
    },
    onSuccess: () => {
      // Invalidate link-spaces cache
      queryClient.invalidateQueries({ queryKey: queryKeys.linkSpaces.all });
    },
  });

  return {
    createSpace: (name: string, color: string) => createMutation.mutateAsync({ name, color }),
    updateSpace: (id: string, updates: { name?: string; color?: string; sort_order?: number }) =>
      updateMutation.mutateAsync({ id, updates }).then(() => true).catch(() => false),
    deleteSpace: (id: string) =>
      deleteMutation.mutateAsync(id).then(() => true).catch(() => false),
    addLinksToSpace: (spaceId: string, linkIds: string[]) =>
      addLinksMutation.mutateAsync({ spaceId, linkIds }).then(() => true).catch(() => false),
    removeLinksFromSpace: (spaceId: string, linkIds: string[]) =>
      removeLinksMutation.mutateAsync({ spaceId, linkIds }).then(() => true).catch(() => false),
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Combined hook that provides both query and mutations
 * This maintains the same API as the old useSpaces hook for easier migration
 */
export function useSpaces(isAuthenticated: boolean, initialSpaces?: Space[]) {
  const { spaces, isLoading, isError, error, refetch } = useSpacesQuery(isAuthenticated, initialSpaces);
  const {
    createSpace,
    updateSpace,
    deleteSpace,
    addLinksToSpace,
    removeLinksFromSpace,
  } = useSpaceMutations();

  return {
    spaces,
    isLoading,
    isError,
    error,
    createSpace,
    updateSpace,
    deleteSpace,
    addLinksToSpace,
    removeLinksFromSpace,
    refetch,
  };
}
