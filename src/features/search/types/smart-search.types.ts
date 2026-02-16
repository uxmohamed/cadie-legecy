export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export type ContentTypeValue = "url" | "color" | "image" | "document" | "note";

export type SmartSearchChip =
  | {
      id: string;
      kind: "date";
      label: string;
      preset: DatePreset;
      startDate?: string;
      endDate?: string;
    }
  | {
      id: string;
      kind: "source";
      label: string;
      sourceId: string;
      domains: string[];
    }
  | {
      id: string;
      kind: "content_type";
      label: string;
      value: ContentTypeValue;
    }
  | {
      id: string;
      kind: "space";
      label: string;
      spaceId: string;
    }
  | {
      id: string;
      kind: "keyword";
      label: string;
      term: string;
    };

export type SmartInterpretLiteralReason =
  | "timeout"
  | "ai_error"
  | "ai_unavailable";

export type SmartPlannerFallbackReason = SmartInterpretLiteralReason;

export interface SmartSearchPlan {
  rewrittenQuery: string;
  chips: SmartSearchChip[];
  confidence: number;
}

export type SmartInterpretResponse =
  | { mode: "smart"; plan: SmartSearchPlan }
  | { mode: "literal"; reason: SmartInterpretLiteralReason; rewrittenQuery?: string };

export interface SmartInterpretRequest {
  query: string;
  timezone: string;
  currentScope: {
    selectedCategoryId: string | null;
  };
  spaces: Array<{ id: string; name: string }>;
  observedDomains?: string[];
}
