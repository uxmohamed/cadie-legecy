import { renderHook } from "@testing-library/react";
import { useSearchLinks } from "@/features/links/hooks/use-search-links";
import type { Link } from "@/features/links/types";
import type { Space } from "@/types";

function makeLink(overrides: Partial<Link>): Link {
  return {
    id: overrides.id ?? "1",
    user_id: "user-1",
    url: "https://example.com",
    clean_url: "https://example.com",
    title: "Example",
    domain: "example.com",
    content_type: "url",
    content_text: null,
    color_value: null,
    favicon_url: null,
    og_image_url: null,
    description: null,
    notes: null,
    ai_summary: null,
    ai_tags: null,
    ai_key_themes: null,
    ai_quotes: null,
    ai_facts: null,
    ai_people: null,
    is_pinned: false,
    is_archived: false,
    is_deleted: false,
    deleted_at: null,
    is_favorite: false,
    read_at: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    final_url: null,
    canonical_url: null,
    site_name: null,
    favicon_variants: null,
    preview_image_width: null,
    preview_image_height: null,
    theme_color: null,
    language: null,
    word_count: null,
    reading_time_minutes: null,
    status_code: null,
    fetch_status: "success",
    fetched_at: null,
    etag: null,
    last_modified: null,
    ...overrides,
  };
}

describe("useSearchLinks", () => {
  it("prioritizes exact/prefix title matches over weaker field matches", () => {
    const links: Link[] = [
      makeLink({
        id: "strong-title",
        title: "React Hooks Guide",
        domain: "react.dev",
      }),
      makeLink({
        id: "weak-description",
        title: "General JS Notes",
        description: "A short mention of react hooks in passing",
      }),
    ];

    const { result } = renderHook(() => useSearchLinks(links, "react hooks"));

    expect(result.current[0].id).toBe("strong-title");
  });

  it("searches across notes and content_text", () => {
    const links: Link[] = [
      makeLink({
        id: "notes-match",
        title: "Design Tokens",
        notes: "Remember to audit accessibility contrast",
      }),
      makeLink({
        id: "content-match",
        title: "Architecture",
        content_text: "This doc explains distributed tracing and observability",
      }),
    ];

    const notesResult = renderHook(() => useSearchLinks(links, "accessibility contrast"));
    const contentResult = renderHook(() => useSearchLinks(links, "distributed tracing"));

    expect(notesResult.result.current.map((l) => l.id)).toContain("notes-match");
    expect(contentResult.result.current.map((l) => l.id)).toContain("content-match");
  });

  it("includes space names in search ranking", () => {
    const links: Link[] = [
      makeLink({ id: "in-design-space", title: "Color system" }),
      makeLink({ id: "outside-design-space", title: "Sprint notes" }),
    ];

    const spaces: Space[] = [
      {
        id: "space-design",
        user_id: "user-1",
        name: "Design",
        color: "#ff0000",
        icon: null,
        description: null,
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        link_count: 1,
      },
    ];

    const linkSpacesMap = new Map<string, string[]>([["in-design-space", ["space-design"]]]);

    const { result } = renderHook(() =>
      useSearchLinks(links, "design", spaces, linkSpacesMap)
    );

    expect(result.current[0].id).toBe("in-design-space");
  });

  it("handles neutral language by downweighting generic words", () => {
    const links: Link[] = [
      makeLink({
        id: "portfolio-note",
        title: "My Portfolio",
        content_type: "note",
      }),
      makeLink({
        id: "other",
        title: "Cooking plan",
      }),
    ];

    const { result } = renderHook(() => useSearchLinks(links, "portfolio links"));
    expect(result.current.map((link) => link.id)).toContain("portfolio-note");
  });

  it("matches meaningful terms from a long natural-language sentence", () => {
    const links: Link[] = [
      makeLink({
        id: "ai-tech",
        title: "AI and Tech Trends",
        description: "Weekly digest",
      }),
      makeLink({
        id: "cooking",
        title: "Cooking basics",
      }),
    ];

    const { result } = renderHook(() =>
      useSearchLinks(links, "I want any link that related to AI and tech.")
    );

    expect(result.current[0]?.id).toBe("ai-tech");
  });
});
