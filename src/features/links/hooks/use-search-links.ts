import { useMemo, useRef } from "react";
import Fuse, { type IFuseOptions, type Expression, type FuseOptionKeyObject } from "fuse.js";
import type { Link } from "../types/link.types";
import type { Space } from "@/types";

/**
 * A searchable wrapper around Link that flattens arrays and resolves
 * space names so Fuse.js can index every field uniformly.
 */
interface SearchableLink {
  /** Original link — returned in results */
  _link: Link;
  title: string;
  url: string;
  domain: string;
  description: string;
  site_name: string;
  ai_summary: string;
  ai_tags: string;
  ai_people: string;
  color_value: string;
  content_type: string;
  spaces: string;
}

/**
 * Fuse.js options tuned for a bookmark manager:
 *
 * - **threshold 0.35** — forgiving enough for typos ("desgn" → "design")
 *   but tight enough to avoid noisy results.
 * - **ignoreLocation** — matches anywhere in the string, not just near the start.
 * - **keys with weights** — title and tags are boosted so a match there
 *   ranks higher than one buried in a URL or description.
 * - **useExtendedSearch** — enables AND (`space separated`), exact (`'term`),
 *   prefix (`^term`), suffix (`term$`), inverse (`!term`) operators.
 */
const FUSE_OPTIONS: IFuseOptions<SearchableLink> = {
  threshold: 0.35,
  ignoreLocation: true,
  useExtendedSearch: true,
  findAllMatches: true,
  keys: [
    { name: "title", weight: 3 },
    { name: "ai_tags", weight: 2.5 },
    { name: "spaces", weight: 2 },
    { name: "domain", weight: 1.5 },
    { name: "url", weight: 1 },
    { name: "description", weight: 1 },
    { name: "site_name", weight: 1 },
    { name: "ai_summary", weight: 0.8 },
    { name: "ai_people", weight: 0.8 },
    { name: "color_value", weight: 0.5 },
    { name: "content_type", weight: 0.3 },
  ],
};

/**
 * Build a flat, searchable record from a Link plus its resolved space names.
 */
function toSearchable(
  link: Link,
  spaceNames: string[]
): SearchableLink {
  return {
    _link: link,
    title: link.title ?? "",
    url: link.url ?? "",
    domain: link.domain ?? "",
    description: link.description ?? "",
    site_name: link.site_name ?? "",
    ai_summary: link.ai_summary ?? "",
    ai_tags: link.ai_tags?.join(" ") ?? "",
    ai_people: link.ai_people?.join(" ") ?? "",
    color_value: link.color_value ?? "",
    content_type: link.content_type ?? "",
    spaces: spaceNames.join(" "),
  };
}

/**
 * Client-side fuzzy search across all link fields, powered by Fuse.js.
 *
 * Features:
 * - **Typo tolerance** — "desgn" matches "design", "gogle" matches "google"
 * - **Relevance ranking** — results sorted by match quality; title/tag
 *   matches rank higher than URL/description matches
 * - **Multi-word AND** — "react hooks" finds links matching both words
 * - **Instant** — runs in-memory with a pre-built index; no network calls
 *
 * Searched fields (by priority):
 * 1. title  2. ai_tags  3. spaces  4. domain
 * 5. url  6. description  7. site_name  8. ai_summary
 * 9. ai_people  10. color_value  11. content_type
 */
export function useSearchLinks(
  links: Link[],
  searchQuery: string,
  spaces?: Space[],
  linkSpacesMap?: Map<string, string[]>
): Link[] {
  // Pre-build spaceId → name lookup
  const spaceNameById = useMemo(() => {
    const map = new Map<string, string>();
    if (spaces) {
      for (const space of spaces) {
        map.set(space.id, space.name);
      }
    }
    return map;
  }, [spaces]);

  // Build searchable records — recalculated when data changes
  const searchableLinks = useMemo(() => {
    return links.map((link) => {
      const spaceIds = linkSpacesMap?.get(link.id);
      const names = spaceIds
        ? spaceIds
            .map((id) => spaceNameById.get(id))
            .filter((n): n is string => n !== undefined)
        : [];
      return toSearchable(link, names);
    });
  }, [links, linkSpacesMap, spaceNameById]);

  // Build Fuse index — only rebuilt when the dataset changes, NOT on every keystroke
  const fuseRef = useRef<Fuse<SearchableLink> | null>(null);
  const fuseDataRef = useRef<SearchableLink[]>([]);

  const fuse = useMemo(() => {
    fuseDataRef.current = searchableLinks;
    fuseRef.current = new Fuse(searchableLinks, FUSE_OPTIONS);
    return fuseRef.current;
  }, [searchableLinks]);

  // Run the search — this is the only part that runs per keystroke
  return useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return links;

    // For multi-word queries, use Fuse extended search AND operator
    // "react hooks" → search for items matching both "react" AND "hooks"
    const terms = trimmed.split(/\s+/).filter(Boolean);
    let query: string | Expression;

    if (terms.length === 1) {
      query = terms[0];
    } else {
      // AND logic: every term must match somewhere
      const keyNames = (FUSE_OPTIONS.keys as FuseOptionKeyObject<SearchableLink>[])!.map(
        (k) => k.name as string
      );
      query = {
        $and: terms.map((term) => ({
          $or: keyNames.map((name) => ({ [name]: term })),
        })),
      };
    }

    const results = fuse.search(query);
    return results.map((r) => r.item._link);
  }, [fuse, searchQuery, links]);
}
