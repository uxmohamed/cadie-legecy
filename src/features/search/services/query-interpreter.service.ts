import OpenAI from "openai";
import { log } from "@/lib/logger";
import {
  aiInterpretResponseSchema,
  sanitizeDomainList,
  type AIInterpretResponseInput,
} from "@/lib/validation/search.schemas";
import {
  SOURCE_BY_ID,
  SOURCE_CATALOG,
  type SourceDefinition,
} from "@/features/search/lib/source-catalog";
import { buildSmartFallbackPlan } from "@/features/search/lib/smart-search-fallback-plan";
import type {
  ContentTypeValue,
  DatePreset,
  SmartInterpretRequest,
  SmartInterpretResponse,
  SmartSearchChip,
} from "@/features/search/types/smart-search.types";

const INTERPRETER_MODEL = "gpt-4o-mini";
const DEFAULT_INTERPRETER_TIMEOUT_MS = 5000;

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

const DATE_PRESET_NORMALIZATION: Record<string, DatePreset> = {
  today: "today",
  yesterday: "yesterday",
  thisweek: "this_week",
  "this week": "this_week",
  lastweek: "last_week",
  "last week": "last_week",
  thismonth: "this_month",
  "this month": "this_month",
  lastmonth: "last_month",
  "last month": "last_month",
  thisyear: "this_year",
  "this year": "this_year",
  lastyear: "last_year",
  "last year": "last_year",
  custom: "custom",
  range: "custom",
};

const CONTENT_TYPE_NORMALIZATION: Record<string, ContentTypeValue> = {
  url: "url",
  urls: "url",
  link: "url",
  links: "url",
  webpage: "url",
  website: "url",
  article: "url",
  post: "url",
  posts: "url",
  color: "color",
  colour: "color",
  image: "image",
  images: "image",
  img: "image",
  imgs: "image",
  pic: "image",
  pics: "image",
  photo: "image",
  photos: "image",
  document: "document",
  documents: "document",
  doc: "document",
  docs: "document",
  pdf: "document",
  note: "note",
  notes: "note",
  text: "note",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

function buildPrompt(input: SmartInterpretRequest): string {
  const spaces = input.spaces.slice(0, 100).map((space) => ({ id: space.id, name: space.name }));
  const sources = SOURCE_CATALOG.map((source) => ({
    sourceId: source.id,
    label: source.label,
    domains: source.domains,
    aliases: source.aliases,
  }));
  const observedDomains = (input.observedDomains || []).slice(0, 100);

  return [
    "You are an AI search planner for a saved-items app.",
    "Understand multilingual and imperfect user text, including abbreviations and typos.",
    "Return STRICT JSON only with shape: {\"rewrittenQuery\": string, \"chips\": Chip[], \"confidence\": number}",
    "Allowed chip kinds: date, source, content_type, space, keyword.",
    "Date preset must be one of: today|yesterday|this_week|last_week|this_month|last_month|this_year|last_year|custom.",
    "content_type value must be one of: url|color|image|document|note.",
    "space chip must use one of provided space IDs.",
    "Use rewrittenQuery as canonical user intent text (short and useful).",
    "Keep chips compact and non-contradictory.",
    "Examples:",
    "- input: \"imgs\" -> rewrittenQuery: \"images\", chip: {kind:\"content_type\", value:\"image\"}",
    "- input: \"item i saved last week\" -> rewrittenQuery: \"saved items\", chip: {kind:\"date\", preset:\"last_week\"}",
    "- input with mixed language should still map to canonical English fields.",
    `Timezone: ${input.timezone}`,
    `Current scope: ${JSON.stringify(input.currentScope)}`,
    `Query: ${input.query}`,
    `Known sources: ${JSON.stringify(sources)}`,
    `User spaces: ${JSON.stringify(spaces)}`,
    `Observed domains in current scope: ${JSON.stringify(observedDomains)}`,
  ].join("\n");
}

function extractJsonFromText(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try next parse candidate.
    }
  }

  return null;
}

function normalizePreset(value: unknown): DatePreset | null {
  if (typeof value !== "string") return null;
  return DATE_PRESET_NORMALIZATION[normalizeToken(value)] || null;
}

function normalizeContentType(value: unknown): ContentTypeValue | null {
  if (typeof value !== "string") return null;
  return CONTENT_TYPE_NORMALIZATION[normalizeToken(value)] || null;
}

function normalizeKind(value: unknown): "date" | "source" | "content_type" | "space" | "keyword" | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeToken(value);

  if (normalized === "date" || normalized === "time") return "date";
  if (normalized === "source" || normalized === "domain" || normalized === "platform") return "source";
  if (
    normalized === "content type" ||
    normalized === "contenttype" ||
    normalized === "type" ||
    normalized === "content"
  ) {
    return "content_type";
  }
  if (normalized === "space" || normalized === "collection" || normalized === "folder") return "space";
  if (normalized === "keyword" || normalized === "query" || normalized === "text") return "keyword";

  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeDomainField(domainValue: unknown): string[] {
  if (typeof domainValue === "string") {
    return sanitizeDomainList([domainValue]);
  }
  if (Array.isArray(domainValue)) {
    return sanitizeDomainList(domainValue.filter((entry): entry is string => typeof entry === "string"));
  }
  return [];
}

function normalizeRewrittenQuery(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

function normalizeChipEntry(
  chip: Record<string, unknown>,
  spaceIdByName: Map<string, string>
): Record<string, unknown> | null {
  const rawKind = chip.kind ?? chip.type ?? chip.field;
  const kind = normalizeKind(rawKind);
  if (!kind) return null;

  if (kind === "date") {
    const preset = normalizePreset(chip.preset ?? chip.value ?? chip.range);
    const startDate = chip.startDate ?? chip.start_date;
    const endDate = chip.endDate ?? chip.end_date;

    if (preset) {
      return {
        kind: "date",
        label: typeof chip.label === "string" ? chip.label : undefined,
        preset,
        startDate: typeof startDate === "string" ? startDate : undefined,
        endDate: typeof endDate === "string" ? endDate : undefined,
      };
    }

    return null;
  }

  if (kind === "source") {
    const sourceIdValue = chip.sourceId ?? chip.source ?? chip.platform ?? chip.id;
    const sourceId = typeof sourceIdValue === "string" ? sourceIdValue.toLowerCase() : undefined;
    const domains = normalizeDomainField(chip.domains ?? chip.domain);

    return {
      kind: "source",
      label: typeof chip.label === "string" ? chip.label : undefined,
      sourceId,
      domains,
    };
  }

  if (kind === "content_type") {
    const normalized = normalizeContentType(chip.value ?? chip.contentType ?? chip.content_type ?? chip.type);
    if (!normalized) return null;

    return {
      kind: "content_type",
      label: typeof chip.label === "string" ? chip.label : undefined,
      value: normalized,
    };
  }

  if (kind === "space") {
    const rawSpaceId = chip.spaceId ?? chip.space_id ?? chip.id;
    const rawSpaceName = chip.name ?? chip.space ?? chip.value;
    const spaceId =
      typeof rawSpaceId === "string"
        ? rawSpaceId
        : typeof rawSpaceName === "string"
          ? spaceIdByName.get(rawSpaceName.trim().toLowerCase())
          : undefined;

    if (!spaceId) return null;
    return {
      kind: "space",
      label: typeof chip.label === "string" ? chip.label : undefined,
      spaceId,
    };
  }

  const termValue = chip.term ?? chip.value ?? chip.keyword ?? chip.text;
  if (typeof termValue !== "string" || !termValue.trim()) return null;

  return {
    kind: "keyword",
    label: typeof chip.label === "string" ? chip.label : undefined,
    term: termValue.trim(),
  };
}

function normalizeInterpretPayload(
  raw: unknown,
  spacesById: Map<string, { id: string; name: string }>,
  fallbackQuery: string
): unknown {
  const root = asObject(raw);
  const spaceIdByName = new Map(
    [...spacesById.values()].map((space) => [space.name.trim().toLowerCase(), space.id])
  );

  let rawChips: unknown[] = [];
  if (Array.isArray(raw)) {
    rawChips = raw;
  } else if (root) {
    const chipsField = root.chips ?? root.filters ?? root.items;
    if (Array.isArray(chipsField)) {
      rawChips = chipsField;
    }
  }

  const chips = rawChips
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => normalizeChipEntry(entry, spaceIdByName))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));

  const rewrittenQuery = root
    ? normalizeRewrittenQuery(
        root.rewrittenQuery ?? root.rewritten_query ?? root.query ?? root.text,
        fallbackQuery
      )
    : fallbackQuery;

  const confidenceRaw = root?.confidence;
  const confidence =
    typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : undefined;

  return { rewrittenQuery, chips, confidence };
}

function sanitizeDateChip(chip: Extract<AIInterpretResponseInput["chips"][number], { kind: "date" }>): SmartSearchChip | null {
  if (chip.preset === "custom") {
    if (!chip.startDate || !chip.endDate) return null;

    return {
      id: crypto.randomUUID(),
      kind: "date",
      label: chip.label?.trim() || `${chip.startDate} to ${chip.endDate}`,
      preset: "custom",
      startDate: chip.startDate,
      endDate: chip.endDate,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "date",
    label: chip.label?.trim() || DATE_PRESET_LABEL[chip.preset],
    preset: chip.preset,
  };
}

function sanitizeSourceChip(
  chip: Extract<AIInterpretResponseInput["chips"][number], { kind: "source" }>
): SmartSearchChip | null {
  const sourceId = chip.sourceId?.trim().toLowerCase();
  const knownSource = sourceId ? SOURCE_BY_ID.get(sourceId) : undefined;

  if (knownSource) {
    return {
      id: crypto.randomUUID(),
      kind: "source",
      label: chip.label?.trim() || knownSource.label,
      sourceId: knownSource.id,
      domains: knownSource.domains,
    };
  }

  const domains = sanitizeDomainList(chip.domains || []);
  if (!domains.length) return null;

  const fallbackSourceId = sourceId || domains[0].replace(/[^a-z0-9-]/g, "-");
  return {
    id: crypto.randomUUID(),
    kind: "source",
    label: chip.label?.trim() || domains[0],
    sourceId: fallbackSourceId,
    domains,
  };
}

function sanitizeContentTypeChip(
  chip: Extract<AIInterpretResponseInput["chips"][number], { kind: "content_type" }>
): SmartSearchChip {
  return {
    id: crypto.randomUUID(),
    kind: "content_type",
    label: chip.label?.trim() || CONTENT_TYPE_LABEL[chip.value],
    value: chip.value,
  };
}

function sanitizeSpaceChip(
  chip: Extract<AIInterpretResponseInput["chips"][number], { kind: "space" }>,
  spacesById: Map<string, { id: string; name: string }>
): SmartSearchChip | null {
  const space = spacesById.get(chip.spaceId);
  if (!space) return null;

  return {
    id: crypto.randomUUID(),
    kind: "space",
    label: chip.label?.trim() || space.name,
    spaceId: space.id,
  };
}

function sanitizeKeywordChip(
  chip: Extract<AIInterpretResponseInput["chips"][number], { kind: "keyword" }>
): SmartSearchChip | null {
  const term = chip.term.trim();
  if (!term) return null;

  return {
    id: crypto.randomUUID(),
    kind: "keyword",
    label: chip.label?.trim() || term,
    term,
  };
}

function sanitizeChips(
  raw: AIInterpretResponseInput,
  spacesById: Map<string, { id: string; name: string }>
): SmartSearchChip[] {
  const chips: SmartSearchChip[] = [];

  for (const chip of raw.chips) {
    if (chip.kind === "date") {
      const sanitized = sanitizeDateChip(chip);
      if (sanitized) chips.push(sanitized);
      continue;
    }

    if (chip.kind === "source") {
      const sanitized = sanitizeSourceChip(chip);
      if (sanitized) chips.push(sanitized);
      continue;
    }

    if (chip.kind === "content_type") {
      chips.push(sanitizeContentTypeChip(chip));
      continue;
    }

    if (chip.kind === "space") {
      const sanitized = sanitizeSpaceChip(chip, spacesById);
      if (sanitized) chips.push(sanitized);
      continue;
    }

    if (chip.kind === "keyword") {
      const sanitized = sanitizeKeywordChip(chip);
      if (sanitized) chips.push(sanitized);
    }
  }

  const deduped = uniqueByKey(chips, (chip) => {
    if (chip.kind === "date") {
      return `date:${chip.preset}:${chip.startDate || ""}:${chip.endDate || ""}`;
    }
    if (chip.kind === "source") {
      return `source:${chip.sourceId}:${chip.domains.join(",")}`;
    }
    if (chip.kind === "content_type") {
      return `content_type:${chip.value}`;
    }
    if (chip.kind === "space") {
      return `space:${chip.spaceId}`;
    }
    return `keyword:${chip.term.toLowerCase()}`;
  });

  return deduped.slice(0, 8);
}

export class QueryInterpreterService {
  private openAIClient: OpenAI | null;
  private readonly timeoutMs: number;

  constructor(client?: OpenAI | null) {
    const configuredTimeout = Number(process.env.SMART_SEARCH_AI_TIMEOUT_MS || "");
    this.timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_INTERPRETER_TIMEOUT_MS;

    if (client !== undefined) {
      this.openAIClient = client;
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    this.openAIClient = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async interpretQuery(input: SmartInterpretRequest): Promise<SmartInterpretResponse> {
    if (!this.openAIClient) {
      return { mode: "literal", reason: "ai_unavailable" };
    }

    const spacesById = new Map(input.spaces.map((space) => [space.id, space]));
    const prompt = buildPrompt(input);

    try {
      const completion = await Promise.race([
        this.openAIClient.chat.completions.create({
          model: INTERPRETER_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You transform natural-language search intent into strict JSON chips. Return JSON only.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
        }),
        new Promise<"timeout">((resolve) => {
          setTimeout(() => resolve("timeout"), this.timeoutMs);
        }),
      ]);

      if (completion === "timeout") {
        return { mode: "literal", reason: "timeout" };
      }

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) {
        return { mode: "literal", reason: "ai_error" };
      }

      const extracted = extractJsonFromText(rawContent);
      if (!extracted) {
        log.warn("[Smart Search] Failed to parse AI JSON response", {
          contentPreview: rawContent.slice(0, 200),
        });
        return { mode: "literal", reason: "ai_error", rewrittenQuery: input.query };
      }

      const normalizedPayload = normalizeInterpretPayload(extracted, spacesById, input.query);
      const parsed = aiInterpretResponseSchema.safeParse(normalizedPayload);
      if (!parsed.success) {
        log.warn("[Smart Search] AI response validation failed", {
          issues: parsed.error.issues.map((issue) => issue.message),
        });
        return { mode: "literal", reason: "ai_error", rewrittenQuery: input.query };
      }

      const chips = sanitizeChips(parsed.data, spacesById);
      const ensuredChips = chips.length
        ? chips
        : buildSmartFallbackPlan(parsed.data.rewrittenQuery).chips;
      return {
        mode: "smart",
        plan: {
          rewrittenQuery: parsed.data.rewrittenQuery,
          chips: ensuredChips,
          confidence: parsed.data.confidence ?? (ensuredChips.length > 0 ? 0.86 : 0.7),
        },
      };
    } catch (error) {
      log.warn("[Smart Search] AI interpreter failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { mode: "literal", reason: "ai_error", rewrittenQuery: input.query };
    }
  }

  getSupportedSources(): SourceDefinition[] {
    return SOURCE_CATALOG;
  }
}
