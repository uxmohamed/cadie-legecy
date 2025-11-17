import {
  canonicalizeColor,
  canonicalizeUrl,
  canonicalizeContent,
} from "../canonicalize";

describe("Canonicalization - Smart Duplicate Detection", () => {
  describe("canonicalizeColor", () => {
    describe("Hex Color Equivalence", () => {
      test("3-digit hex expands correctly", () => {
        expect(canonicalizeColor("#F53")).toBe("#ff5533");
        expect(canonicalizeColor("F53")).toBe("#ff5533");
      });

      test("6-digit hex normalizes to lowercase", () => {
        expect(canonicalizeColor("#FF5733")).toBe("#ff5733");
        expect(canonicalizeColor("FF5733")).toBe("#ff5733");
      });

      test("equivalent 3-digit and 6-digit hex match", () => {
        const short = canonicalizeColor("#F53");
        const long = canonicalizeColor("#FF5533");
        expect(short).toBe(long);
      });

      test("different representations of white", () => {
        expect(canonicalizeColor("#FFF")).toBe("#ffffff");
        expect(canonicalizeColor("#FFFFFF")).toBe("#ffffff");
        expect(canonicalizeColor("white")).toBe("#ffffff");
        expect(canonicalizeColor("WHITE")).toBe("#ffffff");
        
        // All should match
        const variants = ["#FFF", "#FFFFFF", "white", "WHITE", "#fff", "#ffffff"];
        const canonicals = variants.map(v => canonicalizeColor(v));
        const allSame = canonicals.every(c => c === canonicals[0]);
        expect(allSame).toBe(true);
      });

      test("different representations of black", () => {
        expect(canonicalizeColor("#000")).toBe("#000000");
        expect(canonicalizeColor("#000000")).toBe("#000000");
        expect(canonicalizeColor("black")).toBe("#000000");
      });
    });

    describe("RGB to Hex Conversion", () => {
      test("converts rgb to hex", () => {
        expect(canonicalizeColor("rgb(255, 87, 51)")).toBe("#ff5733");
        expect(canonicalizeColor("RGB(255, 87, 51)")).toBe("#ff5733");
      });

      test("converts rgba to hex (ignores alpha)", () => {
        expect(canonicalizeColor("rgba(255, 87, 51, 0.8)")).toBe("#ff5733");
        expect(canonicalizeColor("rgba(255, 87, 51, 1)")).toBe("#ff5733");
      });

      test("converts rgb with no spaces", () => {
        expect(canonicalizeColor("rgb(255,87,51)")).toBe("#ff5733");
      });

      test("white in different formats", () => {
        expect(canonicalizeColor("rgb(255, 255, 255)")).toBe("#ffffff");
        expect(canonicalizeColor("#FFF")).toBe("#ffffff");
        expect(canonicalizeColor("white")).toBe("#ffffff");
      });

      test("black in different formats", () => {
        expect(canonicalizeColor("rgb(0, 0, 0)")).toBe("#000000");
        expect(canonicalizeColor("#000")).toBe("#000000");
        expect(canonicalizeColor("black")).toBe("#000000");
      });
    });

    describe("HSL to Hex Conversion", () => {
      test("converts hsl to hex", () => {
        const result = canonicalizeColor("hsl(9, 100%, 60%)");
        // HSL conversion is approximate due to rounding
        expect(result).toMatch(/^#[0-9a-f]{6}$/);
      });

      test("converts hsla to hex (ignores alpha)", () => {
        const result = canonicalizeColor("hsla(9, 100%, 60%, 0.8)");
        expect(result).toMatch(/^#[0-9a-f]{6}$/);
      });

      test("pure red in hsl", () => {
        expect(canonicalizeColor("hsl(0, 100%, 50%)")).toBe("#ff0000");
      });

      test("pure green in hsl", () => {
        expect(canonicalizeColor("hsl(120, 100%, 50%)")).toBe("#00ff00");
      });

      test("pure blue in hsl", () => {
        expect(canonicalizeColor("hsl(240, 100%, 50%)")).toBe("#0000ff");
      });
    });

    describe("Named Colors", () => {
      test("normalizes named colors to lowercase", () => {
        expect(canonicalizeColor("RED")).toBe("#ff0000");
        expect(canonicalizeColor("Red")).toBe("#ff0000");
        expect(canonicalizeColor("red")).toBe("#ff0000");
      });

      test("all red representations match", () => {
        const redVariants = [
          "red",
          "RED",
          "#F00",
          "#FF0000",
          "rgb(255, 0, 0)",
          "hsl(0, 100%, 50%)",
        ];
        const canonicals = redVariants.map(v => canonicalizeColor(v));
        const allSame = canonicals.every(c => c === "#ff0000");
        expect(allSame).toBe(true);
      });

      test("gray vs grey", () => {
        expect(canonicalizeColor("gray")).toBe("#808080");
        expect(canonicalizeColor("grey")).toBe("#808080");
      });
    });

    describe("Edge Cases", () => {
      test("handles whitespace", () => {
        expect(canonicalizeColor("  #FF5733  ")).toBe("#ff5733");
        expect(canonicalizeColor("  rgb(255, 87, 51)  ")).toBe("#ff5733");
      });

      test("preserves invalid colors as-is", () => {
        expect(canonicalizeColor("notacolor")).toBe("notacolor");
      });
    });
  });

  describe("canonicalizeUrl", () => {
    describe("Basic Normalization", () => {
      test("removes trailing slash", () => {
        expect(canonicalizeUrl("https://example.com/path/")).toBe(
          "example.com/path"
        );
        expect(canonicalizeUrl("https://example.com/path")).toBe(
          "example.com/path"
        );
      });

      test("removes www prefix", () => {
        expect(canonicalizeUrl("https://www.example.com")).toBe("example.com");
        expect(canonicalizeUrl("https://example.com")).toBe("example.com");
      });

      test("normalizes to lowercase", () => {
        expect(canonicalizeUrl("https://Example.COM/Path")).toBe(
          "example.com/path"
        );
      });

      test("removes root slash for consistency", () => {
        expect(canonicalizeUrl("https://example.com/")).toBe("example.com");
        expect(canonicalizeUrl("https://example.com")).toBe("example.com");
      });
    });

    describe("Query Parameter Handling", () => {
      test("sorts query parameters", () => {
        const url1 = "https://example.com?z=1&a=2&m=3";
        const url2 = "https://example.com?a=2&m=3&z=1";
        expect(canonicalizeUrl(url1)).toBe(canonicalizeUrl(url2));
      });

      test("removes tracking parameters", () => {
        const url =
          "https://example.com?id=123&utm_source=google&utm_campaign=test&fbclid=xyz";
        const canonical = canonicalizeUrl(url);
        expect(canonical).toBe("example.com?id=123");
      });

      test("preserves non-tracking parameters", () => {
        const url = "https://example.com?page=1&sort=date&filter=active";
        const canonical = canonicalizeUrl(url);
        expect(canonical).toContain("page=1");
        expect(canonical).toContain("sort=date");
        expect(canonical).toContain("filter=active");
      });
    });

    describe("URL Equivalence", () => {
      test("detects equivalent URLs with different formats", () => {
        const variants = [
          "https://example.com/path",
          "https://www.example.com/path",
          "https://Example.com/path/",
          "HTTPS://example.com/path",
        ];
        const canonicals = variants.map(v => canonicalizeUrl(v));
        const allSame = canonicals.every(c => c === canonicals[0]);
        expect(allSame).toBe(true);
      });

      test("detects URLs with reordered query params", () => {
        const url1 = "https://example.com?a=1&b=2&c=3";
        const url2 = "https://example.com?c=3&a=1&b=2";
        expect(canonicalizeUrl(url1)).toBe(canonicalizeUrl(url2));
      });

      test("detects URLs with tracking params as duplicates", () => {
        const url1 = "https://example.com/article";
        const url2 = "https://example.com/article?utm_source=twitter&fbclid=123";
        expect(canonicalizeUrl(url1)).toBe(canonicalizeUrl(url2));
      });
    });

    describe("Hash Handling", () => {
      test("preserves hash fragments", () => {
        const url = "https://example.com/path#section";
        expect(canonicalizeUrl(url)).toBe("example.com/path#section");
      });

      test("normalizes hash to lowercase", () => {
        const url = "https://example.com/path#SECTION";
        expect(canonicalizeUrl(url)).toBe("example.com/path#section");
      });
    });

    describe("Edge Cases", () => {
      test("handles invalid URLs gracefully", () => {
        const result = canonicalizeUrl("not-a-valid-url");
        expect(typeof result).toBe("string");
        expect(result).toBe("not-a-valid-url");
      });

      test("handles URLs with ports", () => {
        const url = "https://example.com:8080/path";
        const canonical = canonicalizeUrl(url);
        expect(canonical).toContain("example.com");
        expect(canonical).toContain("path");
      });
    });
  });

  describe("canonicalizeContent", () => {
    test("routes color type to canonicalizeColor", () => {
      expect(canonicalizeContent("#F53", "color")).toBe("#ff5533");
      expect(canonicalizeContent("red", "color")).toBe("#ff0000");
    });

    test("routes url type to canonicalizeUrl", () => {
      expect(canonicalizeContent("https://example.com/", "url")).toBe(
        "example.com"
      );
    });

    test("normalizes text type", () => {
      expect(canonicalizeContent("  Hello World  ", "text")).toBe(
        "hello world"
      );
    });

    test("handles different content types correctly", () => {
      const color1 = canonicalizeContent("#F53", "color");
      const color2 = canonicalizeContent("#FF5533", "color");
      expect(color1).toBe(color2);

      const url1 = canonicalizeContent("https://example.com/path", "url");
      const url2 = canonicalizeContent("https://www.example.com/path/", "url");
      expect(url1).toBe(url2);
    });
  });

  describe("Real-World Duplicate Scenarios", () => {
    test("detects duplicate colors in different formats", () => {
      const colors = [
        "#FF5733",
        "FF5733",
        "rgb(255, 87, 51)",
        "RGB(255, 87, 51)",
      ];
      const canonicals = colors.map(c => canonicalizeColor(c));
      const unique = new Set(canonicals);
      expect(unique.size).toBe(1); // All should be the same
    });

    test("detects duplicate URLs with tracking params", () => {
      const urls = [
        "https://example.com/article",
        "https://www.example.com/article/",
        "https://example.com/article?utm_source=google",
        "HTTPS://EXAMPLE.COM/article",
      ];
      const canonicals = urls.map(u => canonicalizeUrl(u));
      const unique = new Set(canonicals);
      expect(unique.size).toBe(1); // All should be the same
    });

    test("3-digit and 6-digit hex are detected as duplicates", () => {
      const short = canonicalizeColor("#F53");
      const long = canonicalizeColor("#FF5533");
      expect(short).toBe(long);
    });

    test("different color formats of same color are duplicates", () => {
      const formats = [
        "#000000",
        "#000",
        "rgb(0, 0, 0)",
        "black",
        "BLACK",
      ];
      const canonicals = formats.map(f => canonicalizeColor(f));
      const unique = new Set(canonicals);
      expect(unique.size).toBe(1);
    });
  });
});

