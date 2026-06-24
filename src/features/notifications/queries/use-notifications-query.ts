"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";
import type { Notification } from "@/features/notifications/types";

export async function fetchNotifications(userId: string, workspaceId?: string | null): Promise<Notification[]> {
  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .select("id,user_id,workspace_id,type,title,body,metadata,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as Notification[];
}

export async function fetchUnreadNotificationCount(userId: string, workspaceId?: string | null): Promise<number> {
  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) {
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", notificationIds)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

export function useNotifications(userId?: string, workspaceId?: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId ?? "", workspaceId ?? null),
    queryFn: () => fetchNotifications(userId!, workspaceId),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount(userId?: string, workspaceId?: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId ?? "", workspaceId ?? null),
    queryFn: () => fetchUnreadNotificationCount(userId!, workspaceId),
    enabled: !!userId,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsAsRead(userId?: string, workspaceId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId, workspaceId ?? null),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(userId, workspaceId ?? null),
      });
    },
  });
}
