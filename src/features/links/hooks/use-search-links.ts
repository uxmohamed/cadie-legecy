import { useMemo } from "react";
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
  notes: string;
  content_text: string;
  spaces: string;
}

interface SearchHit {
  item: SearchableLink;
  score?: number;
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
  threshold: 0.28,
  ignoreLocation: true,
  useExtendedSearch: true,
  findAllMatches: true,
  minMatchCharLength: 2,
  includeScore: true,
  keys: [
    { name: "title", weight: 3 },
    { name: "ai_tags", weight: 2.5 },
    { name: "spaces", weight: 2 },
    { name: "domain", weight: 1.5 },
    { name: "notes", weight: 1.5 },
    { name: "url", weight: 1 },
    { name: "description", weight: 1 },
    { name: "site_name", weight: 1 },
    { name: "content_text", weight: 0.8 },
    { name: "ai_summary", weight: 0.8 },
    { name: "ai_people", weight: 0.8 },
    { name: "color_value", weight: 0.5 },
    { name: "content_type", weight: 0.3 },
  ],
};

const GENERIC_QUERY_TERMS = new Set([
  "i",
  "im",
  "i'm",
  "want",
  "wanna",
  "need",
  "any",
  "all",
  "some",
  "that",
  "this",
  "these",
  "those",
  "related",
  "relation",
  "about",
  "to",
  "and",
  "or",
  "with",
  "please",
  "can",
  "could",
  "would",
  "should",
  "get",
  "give",
  "item",
  "items",
  "saved",
  "save",
  "created",
  "create",
  "added",
  "add",
  "show",
  "find",
  "me",
  "my",
  "in",
  "from",
  "on",
  "for",
  "the",
  "a",
  "an",
  "link",
  "links",
  "url",
  "urls",
]);

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
    notes: link.notes ?? "",
    content_text: link.content_text ?? "",
    spaces: spaceNames.join(" "),
  };
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const term of terms) {
    if (!term || seen.has(term)) continue;
    seen.add(term);
    deduped.push(term);
  }
  return deduped;
}

function mergeTermResults(resultsByTerm: SearchHit[][]): SearchHit[] {
  const bestById = new Map<string, SearchHit>();

  for (const hits of resultsByTerm) {
    for (const hit of hits) {
      const id = hit.item._link.id;
      const prev = bestById.get(id);
      const nextScore = hit.score ?? 1;
      const prevScore = prev?.score ?? 1;
      if (!prev || nextScore < prevScore) {
        bestById.set(id, hit);
      }
    }
  }

  return [...bestById.values()].sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
}

function rerankResult(item: SearchableLink, normalizedQuery: string, terms: string[]): number {
  const title = normalizeText(item.title);
  const domain = normalizeText(item.domain);
  const url = normalizeText(item.url);
  const tags = normalizeText(item.ai_tags);
  const spaces = normalizeText(item.spaces);

  let score = 0;

  if (title === normalizedQuery) score += 220;
  if (title.startsWith(normalizedQuery)) score += 130;
  if (title.includes(normalizedQuery)) score += 95;
  if (domain === normalizedQuery) score += 120;
  if (domain.startsWith(normalizedQuery)) score += 85;
  if (url.includes(normalizedQuery)) score += 65;
  if (tags.includes(normalizedQuery)) score += 60;
  if (spaces.includes(normalizedQuery)) score += 55;

  const coveredTerms = terms.filter((term) =>
    [title, domain, url, tags, spaces].some((field) => field.includes(term))
  ).length;

  score += coveredTerms * 24;
  if (coveredTerms === terms.length && terms.length > 1) {
    score += 75;
  }

  return score;
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
  const fuse = useMemo(() => new Fuse(searchableLinks, FUSE_OPTIONS), [searchableLinks]);

  // Run the search — this is the only part that runs per keystroke
  return useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return links;
    const normalizedQuery = normalizeText(trimmed);
    const terms = uniqueTerms(normalizedQuery.split(/\s+/).filter(Boolean));
    const meaningfulTerms = terms.filter(
      (term) => term.length >= 2 && !GENERIC_QUERY_TERMS.has(term)
    );
    const activeTerms = meaningfulTerms.length > 0 ? meaningfulTerms : terms;

    // For multi-word queries, prefer strict AND matching first for higher precision.
    let query: string | Expression;

    if (activeTerms.length === 1) {
      query = activeTerms[0];
    } else {
      // Avoid over-constraining long natural-language queries.
      if (activeTerms.length <= 4) {
        const keyNames = (FUSE_OPTIONS.keys as FuseOptionKeyObject<SearchableLink>[])!.map(
          (k) => k.name as string
        );
        query = {
          $and: activeTerms.map((term) => ({
            $or: keyNames.map((name) => ({ [name]: term })),
          })),
        };
      } else {
        query = activeTerms.join(" ");
      }
    }

    let results: SearchHit[] = fuse.search(query);

    // If strict term matching is too restrictive, fall back to natural fuzzy search.
    if (!results.length && activeTerms.length > 1) {
      results = fuse.search(activeTerms.join(" "));
    }

    // Last fallback: search by individual terms and merge hits by best score.
    if (!results.length && activeTerms.length > 1) {
      results = mergeTermResults(activeTerms.map((term) => fuse.search(term)));
    }

    return results
      .map((result) => ({
        link: result.item._link,
        score: rerankResult(result.item, normalizedQuery, activeTerms),
        fuseScore: result.score ?? 1,
      }))
      .sort((a, b) => {
        const aCombined = a.score - a.fuseScore * 100;
        const bCombined = b.score - b.fuseScore * 100;
        return bCombined - aCombined;
      })
      .map((entry) => entry.link);
  }, [fuse, searchQuery, links]);
}
