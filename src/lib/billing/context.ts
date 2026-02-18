import { getEntitlements } from "@/lib/billing/entitlements";
import { resolvePlanForUser } from "@/lib/billing/plan-resolver";
import { getSpaceAccess, getUsageSnapshot } from "@/lib/billing/usage";
import type { BillingContext } from "@/lib/billing/types";

export async function getBillingContext(userId: string): Promise<BillingContext> {
  const { plan, billing } = await resolvePlanForUser(userId);
  const entitlements = getEntitlements(plan);

  const [usage, spaceAccess] = await Promise.all([
    getUsageSnapshot(userId),
    getSpaceAccess(userId, entitlements),
  ]);

  return {
    plan,
    billing,
    entitlements,
    usage,
    unlockedSpaceIds: spaceAccess.unlockedSpaceIds,
    lockedSpaceIds: spaceAccess.lockedSpaceIds,
  };
}
