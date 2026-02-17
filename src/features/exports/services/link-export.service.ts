import { createAdminClient } from "@/lib/supabase/server";
import type {
  ExportCsvResult,
  ExportScope,
  LinkExportRow,
  LinkRow,
} from "@/features/exports/types/export.types";

interface LinkSpaceAssignment {
  id: string;
  name: string;
}

const EXPORT_PAGE_SIZE = 500;

export const LINK_EXPORT_COLUMNS = [
  "id",
  "user_id",
  "title",
  "url",
  "clean_url",
  "domain",
  "favicon_url",
  "og_image_url",
  "description",
  "content_text",
  "content_type",
  "color_value",
  "rich_text_content",
  "notes",
  "ai_summary",
  "ai_tags",
  "ai_key_themes",
  "ai_quotes",
  "ai_facts",
  "ai_people",
  "is_archived",
  "is_favorite",
  "is_pinned",
  "read_at",
  "sort_order",
  "created_at",
  "updated_at",
  "final_url",
  "canonical_url",
  "site_name",
  "favicon_variants",
  "preview_image_width",
  "preview_image_height",
  "theme_color",
  "language",
  "word_count",
  "reading_time_minutes",
  "status_code",
  "fetch_status",
  "fetched_at",
  "etag",
  "last_modified",
  "space_ids_json",
  "space_names_json",
] as const;

export function serializeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function createExportFilename(scope: ExportScope, date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `cadie-links-${scope}-${year}${month}${day}-${hours}${minutes}${seconds}.csv`;
}

export function buildLinkExportRow(
  link: LinkRow,
  assignments: LinkSpaceAssignment[]
): LinkExportRow {
  const sortedAssignments = [...assignments].sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    return a.id.localeCompare(b.id);
  });

  return {
    ...link,
    space_ids_json: JSON.stringify(sortedAssignments.map((item) => item.id)),
    space_names_json: JSON.stringify(sortedAssignments.map((item) => item.name)),
  };
}

function toCsvLine(row: LinkExportRow): string {
  const values = LINK_EXPORT_COLUMNS.map((column) => {
    return escapeCsvCell(serializeCsvValue(row[column]));
  });
  return `${values.join(",")}\r\n`;
}

export class LinkExportService {
  constructor(
    private readonly clientFactory: typeof createAdminClient = createAdminClient,
    private readonly pageSize: number = EXPORT_PAGE_SIZE
  ) {}

  async *streamActiveLinksCsv(
    userId: string,
    scope: ExportScope = "active"
  ): AsyncGenerator<string, ExportCsvResult, void> {
    let offset = 0;
    let rowCount = 0;

    const header = `${LINK_EXPORT_COLUMNS.join(",")}\r\n`;
    yield `\uFEFF${header}`;

    while (true) {
      const links = await this.fetchActiveLinksPage(userId, offset);
      if (links.length === 0) {
        break;
      }

      const assignmentsByLinkId = await this.fetchSpaceAssignments(userId, links.map((link) => link.id));

      for (const link of links) {
        const assignments = assignmentsByLinkId.get(link.id) || [];
        const row = buildLinkExportRow(link, assignments);
        yield toCsvLine(row);
        rowCount += 1;
      }

      if (links.length < this.pageSize) {
        break;
      }

      offset += this.pageSize;
    }

    const generatedAt = new Date().toISOString();
    return {
      filename: createExportFilename(scope),
      generatedAt,
      rowCount,
      scope,
    };
  }

  private async fetchActiveLinksPage(userId: string, offset: number): Promise<LinkRow[]> {
    const supabase = this.clientFactory();

    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + this.pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch links for export: ${error.message}`);
    }

    return (data || []) as LinkRow[];
  }

  private async fetchSpaceAssignments(
    userId: string,
    linkIds: string[]
  ): Promise<Map<string, LinkSpaceAssignment[]>> {
    const assignments = new Map<string, LinkSpaceAssignment[]>();

    if (linkIds.length === 0) {
      return assignments;
    }

    const supabase = this.clientFactory();

    const { data: linkSpaceRows, error: linkSpaceError } = await supabase
      .from("link_spaces")
      .select("link_id, space_id")
      .in("link_id", linkIds);

    if (linkSpaceError) {
      throw new Error(`Failed to fetch space mappings for export: ${linkSpaceError.message}`);
    }

    if (!linkSpaceRows || linkSpaceRows.length === 0) {
      return assignments;
    }

    const uniqueSpaceIds = Array.from(
      new Set(
        linkSpaceRows
          .map((row) => row.space_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );

    if (uniqueSpaceIds.length === 0) {
      return assignments;
    }

    const { data: spaces, error: spaceError } = await supabase
      .from("spaces")
      .select("id, name")
      .eq("user_id", userId)
      .in("id", uniqueSpaceIds);

    if (spaceError) {
      throw new Error(`Failed to fetch space names for export: ${spaceError.message}`);
    }

    const spaceById = new Map(
      (spaces || []).map((space) => [space.id, { id: space.id, name: space.name }])
    );

    const dedupeByLink = new Map<string, Set<string>>();

    for (const row of linkSpaceRows) {
      const linkId = row.link_id;
      const space = spaceById.get(row.space_id);
      if (!linkId || !space) {
        continue;
      }

      let seenSpaceIds = dedupeByLink.get(linkId);
      if (!seenSpaceIds) {
        seenSpaceIds = new Set<string>();
        dedupeByLink.set(linkId, seenSpaceIds);
      }

      if (seenSpaceIds.has(space.id)) {
        continue;
      }
      seenSpaceIds.add(space.id);

      const current = assignments.get(linkId) || [];
      current.push(space);
      assignments.set(linkId, current);
    }

    return assignments;
  }
}
