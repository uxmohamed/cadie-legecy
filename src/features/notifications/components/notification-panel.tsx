"use client";

import * as React from "react";
import { useMarkNotificationsAsRead, useNotifications } from "@/features/notifications/queries";

interface NotificationPanelProps {
  userId: string;
  workspaceId?: string | null;
}

export function NotificationPanel({ userId, workspaceId }: NotificationPanelProps) {
  const { data: notifications = [], isError, isLoading, isSuccess, refetch } = useNotifications(userId, workspaceId);
  const markAsRead = useMarkNotificationsAsRead(userId, workspaceId);
  const markedNotificationIdsRef = React.useRef<Set<string>>(new Set());

  const unreadIds = React.useMemo(
    () => notifications.filter((notification) => !notification.read_at).map((notification) => notification.id),
    [notifications],
  );

  React.useEffect(() => {
    if (!isSuccess || unreadIds.length === 0) {
      return;
    }

    const unreadIdsToMark = unreadIds.filter((id) => !markedNotificationIdsRef.current.has(id));
    if (unreadIdsToMark.length === 0) {
      return;
    }

    unreadIdsToMark.forEach((id) => markedNotificationIdsRef.current.add(id));
    markAsRead.mutate(unreadIdsToMark, {
      onError: () => {
        unreadIdsToMark.forEach((id) => markedNotificationIdsRef.current.delete(id));
      },
    });
  }, [isSuccess, markAsRead, unreadIds]);

  if (isLoading) {
    return <div className="p-4 text-sm text-fg-muted">Loading notifications…</div>;
  }

  if (isError) {
    return (
      <div className="space-y-3 p-4 text-sm text-fg-muted">
        <p>Could not load notifications.</p>
        <button className="text-fg underline underline-offset-4" type="button" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return <div className="p-4 text-sm text-fg-muted">No notifications yet</div>;
  }

  return (
    <div className="max-h-96 overflow-y-auto py-2" role="list" aria-label="Notifications">
      {notifications.map((notification) => (
        <article key={notification.id} className="border-b border-border px-4 py-3 last:border-b-0" role="listitem">
          <div className="flex items-start gap-3">
            {!notification.read_at && <span className="mt-1.5 h-2 w-2 rounded-full bg-fg" aria-label="Unread" />}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-fg">{notification.title}</h3>
              {notification.body && <p className="mt-1 text-sm text-fg-muted">{notification.body}</p>}
              <time className="mt-2 block text-xs text-fg-subtle" dateTime={notification.created_at}>
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(notification.created_at),
                )}
              </time>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
