import { z } from "zod";

const DATE_PRESET_VALUES = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "custom",
] as const;

const CONTENT_TYPE_VALUES = ["url", "color", "image", "document", "note"] as const;

function isValidTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isValidYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidHostname(value: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

export const searchInterpretRequestSchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(500, "Query is too long"),
  timezone: z.string().trim().min(1).max(100).refine(isValidTimezone, "Invalid timezone"),
  currentScope: z.object({
    selectedCategoryId: z
      .union([z.null(), z.literal("trash"), z.string().uuid("Invalid scope space id")]),
  }),
  spaces: z
    .array(
      z.object({
        id: z.string().uuid("Invalid space id"),
        name: z.string().trim().min(1).max(120),
      })
    )
    .max(200, "Too many spaces"),
  observedDomains: z
    .array(z.string().trim().min(1).max(255))
    .max(200, "Too many observed domains")
    .optional(),
});

const aiDateChipSchema = z
  .object({
    kind: z.literal("date"),
    label: z.string().trim().min(1).max(120).optional(),
    preset: z.enum(DATE_PRESET_VALUES),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
  })
  .superRefine((chip, ctx) => {
    if (chip.preset !== "custom") return;

    if (!chip.startDate || !chip.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom preset requires startDate and endDate",
      });
      return;
    }

    if (!isValidYmd(chip.startDate) || !isValidYmd(chip.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Custom date range must be YYYY-MM-DD",
      });
      return;
    }

    if (chip.startDate > chip.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate must be before endDate",
      });
    }
  });

const aiSourceChipSchema = z
  .object({
    kind: z.literal("source"),
    label: z.string().trim().min(1).max(120).optional(),
    sourceId: z.string().trim().min(1).max(64).optional(),
    domains: z.array(z.string().trim().min(1).max(255)).max(10).optional(),
  })
  .refine((chip) => Boolean(chip.sourceId || (chip.domains && chip.domains.length > 0)), {
    message: "Source chip requires sourceId or domains",
  });

const aiContentTypeChipSchema = z.object({
  kind: z.literal("content_type"),
  label: z.string().trim().min(1).max(120).optional(),
  value: z.enum(CONTENT_TYPE_VALUES),
});

const aiSpaceChipSchema = z.object({
  kind: z.literal("space"),
  label: z.string().trim().min(1).max(120).optional(),
  spaceId: z.string().uuid(),
});

const aiKeywordChipSchema = z.object({
  kind: z.literal("keyword"),
  label: z.string().trim().min(1).max(120).optional(),
  term: z.string().trim().min(1).max(80),
});

export const aiInterpretChipSchema = z.union([
  aiDateChipSchema,
  aiSourceChipSchema,
  aiContentTypeChipSchema,
  aiSpaceChipSchema,
  aiKeywordChipSchema,
]);

export const aiInterpretResponseSchema = z.object({
  rewrittenQuery: z.string().trim().min(1).max(500),
  chips: z.array(aiInterpretChipSchema).max(12),
  confidence: z.number().min(0).max(1).optional(),
});

export function sanitizeDomainList(domains: string[]): string[] {
  const normalized = domains
    .map((domain) => domain.toLowerCase().replace(/^www\./, "").trim())
    .filter((domain) => isValidHostname(domain));

  return [...new Set(normalized)].slice(0, 10);
}

export type SearchInterpretRequestInput = z.infer<typeof searchInterpretRequestSchema>;
export type AIInterpretResponseInput = z.infer<typeof aiInterpretResponseSchema>;
