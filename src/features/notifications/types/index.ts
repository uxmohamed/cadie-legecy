export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}
