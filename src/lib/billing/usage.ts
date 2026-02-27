import { createAdminClient } from "@/lib/supabase/server";
import type { Entitlements, UsageSnapshot } from "@/lib/billing/types";

interface SpaceRow {
  id: string;
  sort_order: number;
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const supabase = createAdminClient();

  const [itemsResult, spacesResult, imagesResult, documentsResult] = await Promise.all([
    supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false),
    supabase
      .from("spaces")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("content_type", "image"),
    supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("content_type", "document"),
  ]);

  if (itemsResult.error) {
    throw new Error(`Failed to fetch links usage: ${itemsResult.error.message}`);
  }
  if (spacesResult.error) {
    throw new Error(`Failed to fetch spaces usage: ${spacesResult.error.message}`);
  }
  if (imagesResult.error) {
    throw new Error(`Failed to fetch images usage: ${imagesResult.error.message}`);
  }
  if (documentsResult.error) {
    throw new Error(`Failed to fetch documents usage: ${documentsResult.error.message}`);
  }

  return {
    totalSavedItems: itemsResult.count ?? 0,
    spacesTotal: spacesResult.count ?? 0,
    imagesTotal: imagesResult.count ?? 0,
    documentsTotal: documentsResult.count ?? 0,
  };
}

export async function getSpaceAccess(userId: string, entitlements: Entitlements): Promise<{
  orderedSpaces: SpaceRow[];
  unlockedSpaceIds: Set<string>;
  lockedSpaceIds: Set<string>;
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("id, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch space access: ${error.message}`);
  }

  const orderedSpaces = ((data || []) as SpaceRow[]).map((space) => ({
    id: String(space.id),
    sort_order: Number(space.sort_order || 0),
  }));

  const unlockedSpaceIds = new Set<string>();
  const lockedSpaceIds = new Set<string>();

  const maxSpaces = entitlements.maxSpaces;
  if (maxSpaces == null) {
    orderedSpaces.forEach((space) => unlockedSpaceIds.add(space.id));
    return { orderedSpaces, unlockedSpaceIds, lockedSpaceIds };
  }

  orderedSpaces.forEach((space, index) => {
    if (index < maxSpaces) {
      unlockedSpaceIds.add(space.id);
    } else {
      lockedSpaceIds.add(space.id);
    }
  });

  return { orderedSpaces, unlockedSpaceIds, lockedSpaceIds };
}
