import { useMemo } from "react";
import type { Link } from "../types/link.types";
import type { Space } from "@/types";

/**
 * Build a searchable text blob for a link.
 * Joins all relevant fields into one lowercase string for fast substring matching.
 */
function buildSearchableText(
  link: Link,
  spaceNames: string[]
): string {
  const parts: string[] = [
    link.title,
    link.url,
    link.domain,
    link.description ?? "",
    link.site_name ?? "",
    link.ai_summary ?? "",
    link.color_value ?? "",
    link.content_type,
  ];

  // AI tags
  if (link.ai_tags && link.ai_tags.length > 0) {
    parts.push(link.ai_tags.join(" "));
  }

  // AI people
  if (link.ai_people && link.ai_people.length > 0) {
    parts.push(link.ai_people.join(" "));
  }

  // Space names
  if (spaceNames.length > 0) {
    parts.push(spaceNames.join(" "));
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Client-side instant search across all link fields.
 *
 * Supports multi-word queries: every word must match somewhere in the
 * link's searchable text (AND logic). This lets users type
 * "design figma" to find links that mention both words anywhere.
 *
 * Searched fields:
 * - title, url, domain, description, site_name
 * - ai_summary, ai_tags, ai_people
 * - color_value, content_type
 * - space names (via linkSpacesMap)
 */
export function useSearchLinks(
  links: Link[],
  searchQuery: string,
  spaces?: Space[],
  linkSpacesMap?: Map<string, string[]>
): Link[] {
  return useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return links;

    // Split into individual search terms (AND logic)
    const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return links;

    // Pre-build a spaceId→name lookup for efficiency
    const spaceNameById = new Map<string, string>();
    if (spaces) {
      for (const space of spaces) {
        spaceNameById.set(space.id, space.name.toLowerCase());
      }
    }

    return links.filter((link) => {
      // Resolve space names for this link
      const spaceIds = linkSpacesMap?.get(link.id);
      const spaceNames = spaceIds
        ? spaceIds
            .map((id) => spaceNameById.get(id))
            .filter((n): n is string => n !== undefined)
        : [];

      const text = buildSearchableText(link, spaceNames);

      // Every term must appear somewhere in the text
      return terms.every((term) => text.includes(term));
    });
  }, [links, searchQuery, spaces, linkSpacesMap]);
}
