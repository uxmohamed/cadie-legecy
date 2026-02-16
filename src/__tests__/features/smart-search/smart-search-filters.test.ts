import { createMockLink, resetLinkIdCounter } from "@/__tests__/fixtures/link.fixtures";
import {
  applySmartSearchFilters,
  buildSmartEffectiveQuery,
  buildSmartKeywordQuery,
} from "@/features/search/lib/smart-search-filters";
import type { SmartSearchChip } from "@/features/search/types/smart-search.types";

describe("smart-search filters", () => {
  beforeEach(() => {
    resetLinkIdCounter();
  });

  it("applies date/source/type/space chips with AND semantics", () => {
    const links = [
      createMockLink({
        id: "keep-me",
        domain: "x.com",
        content_type: "document",
        created_at: "2026-02-10T10:00:00.000Z",
      }),
      createMockLink({
        id: "wrong-domain",
        domain: "youtube.com",
        content_type: "document",
        created_at: "2026-02-10T10:00:00.000Z",
      }),
      createMockLink({
        id: "wrong-date",
        domain: "x.com",
        content_type: "document",
        created_at: "2026-02-12T10:00:00.000Z",
      }),
      createMockLink({
        id: "wrong-type",
        domain: "x.com",
        content_type: "url",
        created_at: "2026-02-10T10:00:00.000Z",
      }),
      createMockLink({
        id: "wrong-space",
        domain: "x.com",
        content_type: "document",
        created_at: "2026-02-10T10:00:00.000Z",
      }),
    ];

    const chips: SmartSearchChip[] = [
      {
        id: "date-1",
        kind: "date",
        label: "Feb 10",
        preset: "custom",
        startDate: "2026-02-10",
        endDate: "2026-02-10",
      },
      {
        id: "source-1",
        kind: "source",
        label: "Twitter",
        sourceId: "twitter",
        domains: ["twitter.com", "x.com"],
      },
      {
        id: "type-1",
        kind: "content_type",
        label: "Documents",
        value: "document",
      },
      {
        id: "space-1",
        kind: "space",
        label: "Research",
        spaceId: "space-research",
      },
    ];

    const linkSpacesMap = new Map<string, string[]>([
      ["keep-me", ["space-research"]],
      ["wrong-domain", ["space-research"]],
      ["wrong-date", ["space-research"]],
      ["wrong-type", ["space-research"]],
      ["wrong-space", ["space-other"]],
    ]);

    const filtered = applySmartSearchFilters(links, chips, {
      timezone: "UTC",
      linkSpacesMap,
    });

    expect(filtered.map((link) => link.id)).toEqual(["keep-me"]);
  });

  it("builds keyword query from keyword chips", () => {
    const chips: SmartSearchChip[] = [
      { id: "1", kind: "keyword", label: "twitter", term: "twitter" },
      { id: "2", kind: "keyword", label: "post", term: "post" },
      { id: "3", kind: "date", label: "Yesterday", preset: "yesterday" },
    ];

    expect(buildSmartKeywordQuery(chips)).toBe("twitter post");
  });

  it("combines rewritten query, keyword chips, and live refinement text", () => {
    const combined = buildSmartEffectiveQuery({
      rewrittenQuery: "images",
      keywordQuery: "twitter",
      liveQuery: "product shots",
    });

    expect(combined).toBe("images twitter product shots");
  });

  it("removes generic type words from effective query when a matching type chip exists", () => {
    const combined = buildSmartEffectiveQuery({
      rewrittenQuery: "portfolio links",
      keywordQuery: "portfolio links",
      liveQuery: "",
      chips: [{ id: "type-url", kind: "content_type", label: "Links", value: "url" }],
    });

    expect(combined).toBe("portfolio");
  });

  it("compresses neutral language sentence to meaningful terms", () => {
    const combined = buildSmartEffectiveQuery({
      rewrittenQuery: "I want any link that related to AI and tech.",
      chips: [],
    });

    expect(combined).toBe("ai tech");
  });
});
