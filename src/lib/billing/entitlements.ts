import type { Entitlements, PlanTier } from "@/lib/billing/types";

export const LIMIT_WARNING_THRESHOLD = 80;

const MB = 1024 * 1024;

export const PLAN_ENTITLEMENTS: Record<PlanTier, Entitlements> = {
  starter: {
    maxSavedItems: 100,
    maxSpaces: 3,
    maxImageFileBytes: 10 * MB,
    maxDocumentFileBytes: 10 * MB,
    maxImages: 25,
    maxDocuments: 25,
    maxImportFileBytes: 0,
    bookmarkImportEnabled: false,
  },
  pro: {
    maxSavedItems: null,
    maxSpaces: null,
    maxImageFileBytes: 25 * MB,
    maxDocumentFileBytes: 25 * MB,
    maxImages: 2000,
    maxDocuments: 2000,
    maxImportFileBytes: 50 * MB,
    bookmarkImportEnabled: true,
  },
  believer: {
    maxSavedItems: null,
    maxSpaces: null,
    maxImageFileBytes: 25 * MB,
    maxDocumentFileBytes: 25 * MB,
    maxImages: 2000,
    maxDocuments: 2000,
    maxImportFileBytes: 50 * MB,
    bookmarkImportEnabled: true,
  },
};

export function getEntitlements(plan: PlanTier): Entitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export function isNearStarterLimit(totalSavedItems: number): boolean {
  return totalSavedItems >= LIMIT_WARNING_THRESHOLD && totalSavedItems < (PLAN_ENTITLEMENTS.starter.maxSavedItems || 100);
}
