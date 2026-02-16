import { decodeSmartChips, encodeSmartChips } from "@/features/search/lib/smart-search-url";
import type { SmartSearchChip } from "@/features/search/types/smart-search.types";

describe("smart-search URL codec", () => {
  it("round-trips chip arrays", () => {
    const chips: SmartSearchChip[] = [
      { id: "1", kind: "date", label: "Yesterday", preset: "yesterday" },
      {
        id: "2",
        kind: "source",
        label: "Twitter",
        sourceId: "twitter",
        domains: ["twitter.com", "x.com"],
      },
      { id: "3", kind: "keyword", label: "posts", term: "posts" },
    ];

    const encoded = encodeSmartChips(chips);
    expect(encoded).toBeTruthy();

    const decoded = decodeSmartChips(encoded);
    expect(decoded).toEqual(chips);
  });

  it("returns empty chips for invalid sq payloads", () => {
    expect(decodeSmartChips("not-valid")).toEqual([]);
    expect(decodeSmartChips(null)).toEqual([]);
  });
});
