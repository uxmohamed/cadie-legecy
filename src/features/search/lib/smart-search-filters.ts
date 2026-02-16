import type { Link } from "@/features/links/types";
import type { SmartSearchChip } from "@/features/search/types/smart-search.types";
import { SOURCE_BY_ID } from "@/features/search/lib/source-catalog";

interface ApplySmartFiltersOptions {
  timezone: string;
  linkSpacesMap?: Map<string, string[]>;
}

interface DateRange {
  start: string;
  end: string;
}

const QUERY_NOISE_TERMS = new Set([
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
  "website",
  "websites",
  "webpage",
  "webpages",
]);

const CONTENT_TYPE_QUERY_TERMS: Record<
  Extract<SmartSearchChip, { kind: "content_type" }>["value"],
  Set<string>
> = {
  url: new Set(["link", "links", "url", "urls", "website", "websites", "webpage", "webpages"]),
  image: new Set(["img", "imgs", "image", "images", "photo", "photos", "pic", "pics"]),
  document: new Set(["doc", "docs", "document", "documents", "pdf", "pdfs"]),
  note: new Set(["note", "notes", "memo", "memos"]),
  color: new Set(["color", "colors", "colour", "colours"]),
};

function normalizeQueryText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toQueryTokens(parts: string[]): string[] {
  const tokens: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const normalized = normalizeQueryText(part);
    if (!normalized) continue;
    for (const token of normalized.split(/\s+/)) {
      if (token) tokens.push(token);
    }
  }
  return tokens;
}

function toUtcDateFromYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatYmd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(ymd: string, days: number): string {
  const date = toUtcDateFromYmd(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return formatYmd(date);
}

function getMonthRange(ymd: string): DateRange {
  const date = toUtcDateFromYmd(ymd);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = formatYmd(new Date(Date.UTC(year, month, 1)));
  const end = formatYmd(new Date(Date.UTC(year, month + 1, 0)));
  return { start, end };
}

function getYearRange(ymd: string): DateRange {
  const date = toUtcDateFromYmd(ymd);
  const year = date.getUTCFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

function getWeekRange(ymd: string): DateRange {
  const date = toUtcDateFromYmd(ymd);
  const day = date.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const start = addDays(ymd, -mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}

function getYmdInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function resolveDateRange(chip: Extract<SmartSearchChip, { kind: "date" }>, todayYmd: string): DateRange | null {
  if (chip.preset === "custom") {
    if (!chip.startDate || !chip.endDate) return null;
    return { start: chip.startDate, end: chip.endDate };
  }

  if (chip.preset === "today") {
    return { start: todayYmd, end: todayYmd };
  }

  if (chip.preset === "yesterday") {
    const ymd = addDays(todayYmd, -1);
    return { start: ymd, end: ymd };
  }

  if (chip.preset === "this_week") {
    return getWeekRange(todayYmd);
  }

  if (chip.preset === "last_week") {
    const thisWeek = getWeekRange(todayYmd);
    const end = addDays(thisWeek.start, -1);
    const start = addDays(end, -6);
    return { start, end };
  }

  if (chip.preset === "this_month") {
    return getMonthRange(todayYmd);
  }

  if (chip.preset === "last_month") {
    const thisMonthStart = getMonthRange(todayYmd).start;
    const prevMonthDay = addDays(thisMonthStart, -1);
    return getMonthRange(prevMonthDay);
  }

  if (chip.preset === "this_year") {
    return getYearRange(todayYmd);
  }

  if (chip.preset === "last_year") {
    const thisYearStart = getYearRange(todayYmd).start;
    const prevYearDay = addDays(thisYearStart, -1);
    return getYearRange(prevYearDay);
  }

  return null;
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, "").trim();
}

function domainMatches(linkDomain: string, candidateDomains: string[]): boolean {
  const normalizedLinkDomain = normalizeDomain(linkDomain);
  if (!normalizedLinkDomain) return false;

  return candidateDomains.some((candidate) => {
    const normalizedCandidate = normalizeDomain(candidate);
    return (
      normalizedLinkDomain === normalizedCandidate ||
      normalizedLinkDomain.endsWith(`.${normalizedCandidate}`)
    );
  });
}

function matchesDateChip(
  link: Link,
  chip: Extract<SmartSearchChip, { kind: "date" }>,
  todayYmd: string,
  timezone: string
): boolean {
  if (!link.created_at) return false;

  const range = resolveDateRange(chip, todayYmd);
  if (!range) return false;

  const createdAtYmd = getYmdInTimezone(new Date(link.created_at), timezone);
  return createdAtYmd >= range.start && createdAtYmd <= range.end;
}

function matchesSourceChip(link: Link, chip: Extract<SmartSearchChip, { kind: "source" }>): boolean {
  const source = SOURCE_BY_ID.get(chip.sourceId);
  const candidateDomains = source?.domains?.length ? source.domains : chip.domains;
  if (!candidateDomains.length) return false;

  return domainMatches(link.domain || "", candidateDomains);
}

function matchesSpaceChip(
  link: Link,
  chip: Extract<SmartSearchChip, { kind: "space" }>,
  linkSpacesMap?: Map<string, string[]>
): boolean {
  if (!linkSpacesMap) return false;

  const spaces = linkSpacesMap.get(link.id) || [];
  return spaces.includes(chip.spaceId);
}

export function buildSmartKeywordQuery(chips: SmartSearchChip[]): string {
  return chips
    .filter((chip): chip is Extract<SmartSearchChip, { kind: "keyword" }> => chip.kind === "keyword")
    .map((chip) => chip.term.trim())
    .filter(Boolean)
    .join(" ");
}

export function buildSmartEffectiveQuery(params: {
  rewrittenQuery?: string;
  keywordQuery?: string;
  liveQuery?: string;
  chips?: SmartSearchChip[];
}): string {
  const hasSmartContext = Boolean(params.rewrittenQuery?.trim()) || Boolean(params.chips?.length);
  const rawParts = [params.rewrittenQuery || "", params.keywordQuery || "", params.liveQuery || ""];

  if (!hasSmartContext) {
    return rawParts
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const contentTypeTerms = new Set<string>();
  for (const chip of params.chips || []) {
    if (chip.kind === "content_type") {
      for (const token of CONTENT_TYPE_QUERY_TERMS[chip.value]) {
        contentTypeTerms.add(token);
      }
    }
  }

  const dedupedTokens: string[] = [];
  const seen = new Set<string>();
  for (const token of toQueryTokens(rawParts)) {
    if (seen.has(token)) continue;
    seen.add(token);
    dedupedTokens.push(token);
  }

  const filteredTokens = dedupedTokens.filter(
    (token) => !QUERY_NOISE_TERMS.has(token) && !contentTypeTerms.has(token)
  );

  const outputTokens = filteredTokens.length ? filteredTokens : dedupedTokens;
  return outputTokens.join(" ").trim();
}

export function applySmartSearchFilters(
  links: Link[],
  chips: SmartSearchChip[],
  options: ApplySmartFiltersOptions
): Link[] {
  if (!chips.length) return links;

  const todayYmd = getYmdInTimezone(new Date(), options.timezone);

  return links.filter((link) => {
    for (const chip of chips) {
      if (chip.kind === "keyword") continue;

      if (chip.kind === "date" && !matchesDateChip(link, chip, todayYmd, options.timezone)) {
        return false;
      }

      if (chip.kind === "source" && !matchesSourceChip(link, chip)) {
        return false;
      }

      if (chip.kind === "content_type" && link.content_type !== chip.value) {
        return false;
      }

      if (chip.kind === "space" && !matchesSpaceChip(link, chip, options.linkSpacesMap)) {
        return false;
      }
    }

    return true;
  });
}
