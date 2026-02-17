import {
  buildLinkExportRow,
  createExportFilename,
  escapeCsvCell,
  LinkExportService,
  serializeCsvValue,
} from "@/features/exports/services/link-export.service";
import type { LinkRow } from "@/features/exports/types/export.types";

function createLinkRow(overrides: Partial<LinkRow> = {}): LinkRow {
  return {
    id: "link-1",
    user_id: "user-1",
    title: "Example",
    url: "https://example.com",
    clean_url: "https://example.com",
    domain: "example.com",
    favicon_url: null,
    og_image_url: null,
    description: null,
    content_text: null,
    content_type: "url",
    color_value: null,
    rich_text_content: null,
    notes: null,
    ai_summary: null,
    ai_tags: null,
    ai_key_themes: null,
    ai_quotes: null,
    ai_facts: null,
    ai_people: null,
    is_archived: false,
    is_favorite: false,
    is_pinned: false,
    read_at: null,
    sort_order: 0,
    created_at: "2026-02-17T00:00:00.000Z",
    updated_at: "2026-02-17T00:00:00.000Z",
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

describe("link-export.service utilities", () => {
  it("serializes and escapes CSV values safely", () => {
    expect(serializeCsvValue(null)).toBe("");
    expect(serializeCsvValue(false)).toBe("false");
    expect(serializeCsvValue(42)).toBe("42");
    expect(serializeCsvValue(["a", "b"])).toBe('["a","b"]');

    expect(escapeCsvCell("simple")).toBe("simple");
    expect(escapeCsvCell("with,comma")).toBe('"with,comma"');
    expect(escapeCsvCell('with"quote')).toBe('"with""quote"');
    expect(escapeCsvCell("multi\nline")).toBe('"multi\nline"');
  });

  it("builds deterministic space JSON columns", () => {
    const row = buildLinkExportRow(createLinkRow(), [
      { id: "space-b", name: "Work" },
      { id: "space-a", name: "Reading" },
    ]);

    expect(row.space_names_json).toBe('["Reading","Work"]');
    expect(row.space_ids_json).toBe('["space-a","space-b"]');
  });

  it("builds UTC timestamped filename", () => {
    const date = new Date("2026-02-17T19:40:05.000Z");
    expect(createExportFilename("active", date)).toBe(
      "cadie-links-active-20260217-194005.csv"
    );
  });
});

describe("LinkExportService", () => {
  it("enforces active-only filters and deterministic link ordering", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const orderCalls: Array<[string, { ascending: boolean }]> = [];

    const linksPage = [
      createLinkRow({ id: "link-2", created_at: "2026-02-18T00:00:00.000Z" }),
    ];

    let linkPageQueryCount = 0;

    const clientFactory = () => ({
      from: (table: string) => {
        if (table === "links") {
          const builder: {
            select: jest.Mock;
            eq: jest.Mock;
            order: jest.Mock;
            range: jest.Mock;
          } = {} as never;

          builder.select = jest.fn(() => builder);
          builder.eq = jest.fn((column: string, value: unknown) => {
              eqCalls.push([column, value]);
              return builder;
            });
          builder.order = jest.fn((column: string, options: { ascending: boolean }) => {
              orderCalls.push([column, options]);
              return builder;
            });
          builder.range = jest.fn(async () => {
              linkPageQueryCount += 1;
              return {
                data: linkPageQueryCount === 1 ? linksPage : [],
                error: null,
              };
            });
          return builder;
        }

        if (table === "link_spaces") {
          const builder: { select: jest.Mock; in: jest.Mock } = {} as never;
          builder.select = jest.fn(() => builder);
          builder.in = jest.fn(async () => ({
              data: [{ link_id: "link-2", space_id: "space-1" }],
              error: null,
            }));
          return builder;
        }

        const builder: { select: jest.Mock; eq: jest.Mock; in: jest.Mock } = {} as never;
        builder.select = jest.fn(() => builder);
        builder.eq = jest.fn(() => builder);
        builder.in = jest.fn(async () => ({
            data: [{ id: "space-1", name: "Work" }],
            error: null,
          }));
        return builder;
      },
    });

    const service = new LinkExportService(clientFactory as never, 1);
    const iterator = service.streamActiveLinksCsv("user-1", "active");

    const first = await iterator.next();
    const second = await iterator.next();

    expect(first.done).toBe(false);
    expect(first.value).toContain("id,user_id,title,url");

    expect(second.done).toBe(false);
    expect(second.value).toContain("link-2");
    expect(second.value).toContain('"[""space-1""]"');

    await iterator.next();

    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ["user_id", "user-1"],
        ["is_deleted", false],
        ["is_archived", false],
      ])
    );
    expect(orderCalls).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
  });
});
