import type {
  ContentTypeValue,
  DatePreset,
  SmartSearchChip,
  SmartSearchPlan,
} from "@/features/search/types/smart-search.types";
import { SOURCE_CATALOG } from "@/features/search/lib/source-catalog";

const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  last_year: "Last year",
  custom: "Custom range",
};

const CONTENT_TYPE_LABEL: Record<ContentTypeValue, string> = {
  url: "Links",
  color: "Colors",
  image: "Images",
  document: "Documents",
  note: "Notes",
};

const DATE_TERM_MAP: Array<{ term: string; preset: DatePreset }> = [
  { term: "today", preset: "today" },
  { term: "yesterday", preset: "yesterday" },
  { term: "this week", preset: "this_week" },
  { term: "last week", preset: "last_week" },
  { term: "this month", preset: "this_month" },
  { term: "last month", preset: "last_month" },
  { term: "this year", preset: "this_year" },
  { term: "last year", preset: "last_year" },
];

const CONTENT_TERM_MAP: Array<{ term: string; value: ContentTypeValue }> = [
  { term: "imgs", value: "image" },
  { term: "img", value: "image" },
  { term: "images", value: "image" },
  { term: "image", value: "image" },
  { term: "photos", value: "image" },
  { term: "photo", value: "image" },
  { term: "pics", value: "image" },
  { term: "pic", value: "image" },
  { term: "pdfs", value: "document" },
  { term: "pdf", value: "document" },
  { term: "docs", value: "document" },
  { term: "doc", value: "document" },
  { term: "documents", value: "document" },
  { term: "document", value: "document" },
  { term: "notes", value: "note" },
  { term: "note", value: "note" },
  { term: "colors", value: "color" },
  { term: "color", value: "color" },
];

const NOISE_TERMS = new Set([
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
  "post",
  "posts",
]);

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
}

function includesTerm(normalizedQuery: string, term: string): boolean {
  return termRegex(term).test(normalizedQuery);
}

function pickDatePreset(normalizedQuery: string): DatePreset | null {
  for (const entry of DATE_TERM_MAP) {
    if (includesTerm(normalizedQuery, entry.term)) {
      return entry.preset;
    }
  }
  return null;
}

function pickContentType(normalizedQuery: string): ContentTypeValue | null {
  for (const entry of CONTENT_TERM_MAP) {
    if (includesTerm(normalizedQuery, entry.term)) {
      return entry.value;
    }
  }
  return null;
}

function pickSource(normalizedQuery: string): (typeof SOURCE_CATALOG)[number] | null {
  for (const source of SOURCE_CATALOG) {
    const terms = [source.id, source.label.toLowerCase(), ...source.aliases];
    if (terms.some((term) => includesTerm(normalizedQuery, term))) {
      return source;
    }
  }
  return null;
}

function toKeywordText(normalizedQuery: string): string {
  const tokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !NOISE_TERMS.has(token));

  if (!tokens.length) {
    return normalizedQuery;
  }

  return tokens.join(" ").slice(0, 80).trim();
}

export function buildSmartFallbackPlan(query: string): SmartSearchPlan {
  const normalizedQuery = normalizeQuery(query);
  const baseQuery = normalizedQuery || query.trim();
  const chips: SmartSearchChip[] = [];

  const datePreset = pickDatePreset(baseQuery);
  if (datePreset) {
    chips.push({
      id: crypto.randomUUID(),
      kind: "date",
      label: DATE_PRESET_LABEL[datePreset],
      preset: datePreset,
    });
  }

  const contentType = pickContentType(baseQuery);
  if (contentType) {
    chips.push({
      id: crypto.randomUUID(),
      kind: "content_type",
      label: CONTENT_TYPE_LABEL[contentType],
      value: contentType,
    });
  }

  const source = pickSource(baseQuery);
  if (source) {
    chips.push({
      id: crypto.randomUUID(),
      kind: "source",
      label: source.label,
      sourceId: source.id,
      domains: source.domains,
    });
  }

  const keywordTerm = toKeywordText(baseQuery);
  if (keywordTerm) {
    chips.push({
      id: crypto.randomUUID(),
      kind: "keyword",
      label: keywordTerm,
      term: keywordTerm,
    });
  }

  const deduped = chips.filter((chip, index, arr) => {
    if (chip.kind === "date") {
      return arr.findIndex((item) => item.kind === "date" && item.preset === chip.preset) === index;
    }
    if (chip.kind === "content_type") {
      return arr.findIndex((item) => item.kind === "content_type" && item.value === chip.value) === index;
    }
    if (chip.kind === "source") {
      return arr.findIndex((item) => item.kind === "source" && item.sourceId === chip.sourceId) === index;
    }
    return arr.findIndex((item) => item.kind === "keyword" && item.term === chip.term) === index;
  });

  return {
    rewrittenQuery: keywordTerm || query.trim(),
    chips: deduped.slice(0, 4),
    confidence: 0.35,
  };
}
