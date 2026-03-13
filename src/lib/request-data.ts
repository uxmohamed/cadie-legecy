import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth-middleware";

type SupabaseDataClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

type SpaceLite = {
  id: string;
  name: string;
  color: string;
};

type SpaceWithOptionalDescription = SpaceLite & {
  sort_order: number;
  description?: string | null;
  [key: string]: unknown;
};

type LinkIdRow = { id: string };
type LinkSpaceRow = { link_id: string; space_id: string };

export class RequestDataAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "RequestDataAccessError";
  }
}

function isMissingSpacesDescriptionColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return message.includes("'description' column of 'spaces'") || message.includes("column \"description\" of relation \"spaces\"");
}

export class RequestDataAccess {
  private clientPromise?: Promise<SupabaseDataClient>;

  constructor(private readonly context: RequestContext) {}

  private async getClient(): Promise<SupabaseDataClient> {
    if (!this.clientPromise) {
      this.clientPromise = this.context.authSource === "api_token"
        ? Promise.resolve(createAdminClient())
        : createClient();
    }

    return this.clientPromise;
  }

  private async ensureOwnedSpace(spaceId: string): Promise<void> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("spaces")
      .select("id")
      .eq("id", spaceId)
      .eq("user_id", this.context.userId)
      .maybeSingle();

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }

    if (!data) {
      throw new RequestDataAccessError("Space not found", 404);
    }
  }

  private async ensureOwnedLink(linkId: string): Promise<void> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("links")
      .select("id")
      .eq("id", linkId)
      .eq("user_id", this.context.userId)
      .maybeSingle();

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }

    if (!data) {
      throw new RequestDataAccessError("Link not found", 404);
    }
  }

  private async ensureOwnedLinks(linkIds: string[]): Promise<void> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("links")
      .select("id")
      .eq("user_id", this.context.userId)
      .in("id", linkIds);

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }

    if (!data || data.length !== linkIds.length) {
      throw new RequestDataAccessError("One or more links not found", 404);
    }
  }

  async listSpacesLite(): Promise<SpaceLite[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("spaces")
      .select("id, name, color")
      .eq("user_id", this.context.userId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }

    return (data || []) as SpaceLite[];
  }

  async listSpacesWithCounts(): Promise<Array<Record<string, unknown>>> {
    const supabase = await this.getClient();
    const [spacesResult, activeLinksResult] = await Promise.all([
      supabase
        .from("spaces")
        .select("*")
        .eq("user_id", this.context.userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("links")
        .select("id")
        .eq("user_id", this.context.userId)
        .eq("is_deleted", false)
        .eq("is_archived", false),
    ]);

    if (spacesResult.error) {
      throw new RequestDataAccessError(spacesResult.error.message, 500);
    }

    if (activeLinksResult.error) {
      throw new RequestDataAccessError(activeLinksResult.error.message, 500);
    }

    const spaces = (spacesResult.data || []) as SpaceWithOptionalDescription[];
    const activeLinks = (activeLinksResult.data || []) as LinkIdRow[];
    const spaceIds = spaces.map((space) => space.id);

    if (spaceIds.length === 0 || activeLinks.length === 0) {
      return spaces.map((space) => ({
        ...space,
        description: space.description ?? null,
        link_count: 0,
      }));
    }

    const { data: linkSpaces, error: linkSpacesError } = await supabase
      .from("link_spaces")
      .select("space_id, link_id")
      .in("space_id", spaceIds);

    if (linkSpacesError) {
      throw new RequestDataAccessError(linkSpacesError.message, 500);
    }

    const activeLinkIds = new Set(activeLinks.map((link) => link.id));
    const counts: Record<string, number> = {};

    ((linkSpaces || []) as LinkSpaceRow[]).forEach((linkSpace) => {
      if (activeLinkIds.has(linkSpace.link_id)) {
        counts[linkSpace.space_id] = (counts[linkSpace.space_id] || 0) + 1;
      }
    });

    return spaces.map((space) => ({
      ...space,
      description: space.description ?? null,
      link_count: counts[space.id] || 0,
    }));
  }

  async createSpace(input: {
    name: string;
    color: string;
    sortOrder: number;
    description: string | null;
  }): Promise<Record<string, unknown>> {
    const supabase = await this.getClient();
    const insertPayload: {
      user_id: string;
      name: string;
      color: string;
      sort_order: number;
      description?: string | null;
    } = {
      user_id: this.context.userId,
      name: input.name,
      color: input.color,
      sort_order: input.sortOrder,
    };

    if (input.description) {
      insertPayload.description = input.description;
    }

    let { data, error } = await supabase
      .from("spaces")
      .insert(insertPayload)
      .select()
      .single();

    if (error && insertPayload.description !== undefined && isMissingSpacesDescriptionColumn(error)) {
      ({ data, error } = await supabase
        .from("spaces")
        .insert({
          user_id: this.context.userId,
          name: input.name,
          color: input.color,
          sort_order: input.sortOrder,
        })
        .select()
        .single());
    }

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }

    return {
      ...(data as Record<string, unknown>),
      description: (data as { description?: string | null } | null)?.description ?? null,
    };
  }

  async addLinksToSpace(
    spaceId: string,
    linkIds: string[],
    options?: { skipBatchOwnershipCheck?: boolean }
  ): Promise<{ inserted: unknown[] | null; duplicateOnly: boolean }> {
    const supabase = await this.getClient();

    await this.ensureOwnedSpace(spaceId);

    if (options?.skipBatchOwnershipCheck && linkIds.length === 1) {
      const { data, error } = await supabase
        .from("links")
        .select("id")
        .eq("id", linkIds[0])
        .eq("user_id", this.context.userId)
        .maybeSingle();

      if (error) {
        throw new RequestDataAccessError(error.message, 500);
      }

      if (!data) {
        throw new RequestDataAccessError("One or more links not found", 404);
      }
    } else {
      await this.ensureOwnedLinks(linkIds);
    }

    const { data, error } = await supabase
      .from("link_spaces")
      .insert(linkIds.map((linkId) => ({ link_id: linkId, space_id: spaceId })))
      .select();

    if (error) {
      if (error.code === "23505") {
        return { inserted: null, duplicateOnly: true };
      }

      throw new RequestDataAccessError(error.message, 500);
    }

    return {
      inserted: data || null,
      duplicateOnly: false,
    };
  }

  async removeLinksFromSpace(spaceId: string, linkIds: string[]): Promise<void> {
    const supabase = await this.getClient();

    await this.ensureOwnedSpace(spaceId);
    await this.ensureOwnedLinks(linkIds);

    const { error } = await supabase
      .from("link_spaces")
      .delete()
      .eq("space_id", spaceId)
      .in("link_id", linkIds);

    if (error) {
      throw new RequestDataAccessError(error.message, 500);
    }
  }

  async getLinkSpaceIds(linkId: string): Promise<string[]> {
    const supabase = await this.getClient();

    await this.ensureOwnedLink(linkId);

    const { data: linkSpaces, error: linkSpacesError } = await supabase
      .from("link_spaces")
      .select("space_id")
      .eq("link_id", linkId);

    if (linkSpacesError) {
      throw new RequestDataAccessError(linkSpacesError.message, 500);
    }

    const spaceIds = ((linkSpaces || []) as Array<{ space_id: string }>).map((entry) => entry.space_id);
    if (spaceIds.length === 0) {
      return [];
    }

    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id")
      .eq("user_id", this.context.userId)
      .in("id", spaceIds);

    if (spacesError) {
      throw new RequestDataAccessError(spacesError.message, 500);
    }

    const allowedSpaceIds = new Set(((spaces || []) as Array<{ id: string }>).map((space) => space.id));
    return spaceIds.filter((spaceId) => allowedSpaceIds.has(spaceId));
  }

  async getLinkContext(linkId: string): Promise<{
    spaces: SpaceLite[];
    selectedSpaceIds: string[];
  }> {
    const supabase = await this.getClient();

    await this.ensureOwnedLink(linkId);

    const [spacesResult, selectedResult] = await Promise.all([
      supabase
        .from("spaces")
        .select("id, name, color")
        .eq("user_id", this.context.userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("link_spaces")
        .select("space_id")
        .eq("link_id", linkId),
    ]);

    if (spacesResult.error) {
      throw new RequestDataAccessError(spacesResult.error.message, 500);
    }

    if (selectedResult.error) {
      throw new RequestDataAccessError(selectedResult.error.message, 500);
    }

    const spaces = (spacesResult.data || []) as SpaceLite[];
    const selectedSpaceIds = ((selectedResult.data || []) as Array<{ space_id: string }>).map((row) => row.space_id);
    const allowedSpaceIds = new Set(spaces.map((space) => space.id));

    return {
      spaces,
      selectedSpaceIds: selectedSpaceIds.filter((spaceId) => allowedSpaceIds.has(spaceId)),
    };
  }
}
