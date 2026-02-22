export type PlanTier = "starter" | "pro" | "believer";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled"
  | "paused"
  | "unpaid"
  | "expired";

export type BillingInterval = "month" | "year" | null;

export type LimitKey =
  | "saved_items"
  | "spaces"
  | "locked_space"
  | "images"
  | "documents"
  | "image_file_size"
  | "document_file_size"
  | "imports";

export interface Entitlements {
  maxSavedItems: number | null;
  maxSpaces: number | null;
  maxImageFileBytes: number;
  maxDocumentFileBytes: number;
  maxImages: number | null;
  maxDocuments: number | null;
  maxImportFileBytes: number;
  bookmarkImportEnabled: boolean;
}

export interface UsageSnapshot {
  totalSavedItems: number;
  spacesTotal: number;
  imagesTotal: number;
  documentsTotal: number;
}

export interface UserBillingRecord {
  user_id: string;
  plan_tier: PlanTier;
  subscription_status: SubscriptionStatus;
  billing_interval: BillingInterval;
  lemon_customer_id: string | null;
  lemon_subscription_id: string | null;
  lemon_variant_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  support_amount_cents: number | null;
  last_webhook_event_at: string | null;
  lemon_last_event_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingContext {
  plan: PlanTier;
  billing: UserBillingRecord | null;
  entitlements: Entitlements;
  usage: UsageSnapshot;
  unlockedSpaceIds: Set<string>;
  lockedSpaceIds: Set<string>;
}

export interface PlanLimitPayload {
  code: "PLAN_LIMIT_REACHED";
  limit_key: LimitKey;
  current: number | null;
  max: number | null;
  upgrade_required: true;
  plan: PlanTier;
  message: string;
}
