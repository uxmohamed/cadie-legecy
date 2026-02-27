import { normalizeUrl } from "@/lib/url.utils";

describe("normalizeUrl", () => {
  it("preserves duplicate query parameter values while sorting keys", () => {
    const normalized = normalizeUrl(
      "https://example.com/search?tag=javascript&tag=typescript&tag=react&page=1"
    );

    expect(normalized).toBe(
      "https://example.com/search?page=1&tag=javascript&tag=typescript&tag=react"
    );
  });

  it("keeps different duplicate-parameter combinations distinct", () => {
    const a = normalizeUrl("https://dev.to/search?tag=javascript&tag=react");
    const b = normalizeUrl("https://dev.to/search?tag=javascript&tag=python");

    expect(a).toBe("https://dev.to/search?tag=javascript&tag=react");
    expect(b).toBe("https://dev.to/search?tag=javascript&tag=python");
    expect(a).not.toBe(b);
  });
});
