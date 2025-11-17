import { detectContentType } from "../content-detector";

describe("Content Detector - Color Detection", () => {
  describe("Hex Colors", () => {
    test("should detect 6-digit hex with #", () => {
      const result = detectContentType("#FF5733");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#FF5733");
    });

    test("should detect 6-digit hex without #", () => {
      const result = detectContentType("FF5733");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#FF5733");
    });

    test("should detect 3-digit hex with #", () => {
      const result = detectContentType("#F53");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#F53");
    });

    test("should detect 3-digit hex without #", () => {
      const result = detectContentType("F53");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#F53");
    });

    test("should detect lowercase hex", () => {
      const result = detectContentType("ff5733");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#ff5733");
    });

    test("should detect uppercase hex", () => {
      const result = detectContentType("FF5733");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#FF5733");
    });

    test("should detect mixed case hex", () => {
      const result = detectContentType("Ff5733");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#Ff5733");
    });

    test("should NOT detect invalid hex (7 digits)", () => {
      const result = detectContentType("FF57337");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect invalid hex (5 digits)", () => {
      const result = detectContentType("FF573");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect hex with invalid characters", () => {
      const result = detectContentType("FF57GG");
      expect(result.type).not.toBe("color");
    });
  });

  describe("RGB Colors", () => {
    test("should detect rgb with no spaces", () => {
      const result = detectContentType("rgb(255,87,51)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgb(255,87,51)");
    });

    test("should detect rgb with spaces", () => {
      const result = detectContentType("rgb(255, 87, 51)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgb(255, 87, 51)");
    });

    test("should detect rgb with extra spaces", () => {
      const result = detectContentType("rgb(255,  87,  51)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgb(255,  87,  51)");
    });

    test("should detect rgb with lowercase", () => {
      const result = detectContentType("rgb(255, 87, 51)");
      expect(result.type).toBe("color");
    });

    test("should detect rgb with uppercase", () => {
      const result = detectContentType("RGB(255, 87, 51)");
      expect(result.type).toBe("color");
    });

    test("should detect rgb with 0 values", () => {
      const result = detectContentType("rgb(0, 0, 0)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgb(0, 0, 0)");
    });

    test("should detect rgb with 255 values", () => {
      const result = detectContentType("rgb(255, 255, 255)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgb(255, 255, 255)");
    });

    test("should NOT detect rgb with values > 255", () => {
      const result = detectContentType("rgb(256, 87, 51)");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect rgb with negative values", () => {
      const result = detectContentType("rgb(-1, 87, 51)");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect rgb with 2 values", () => {
      const result = detectContentType("rgb(255, 87)");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect rgb with 4 values", () => {
      const result = detectContentType("rgb(255, 87, 51, 100)");
      expect(result.type).not.toBe("color");
    });
  });

  describe("RGBA Colors", () => {
    test("should detect rgba with integer alpha", () => {
      const result = detectContentType("rgba(255, 87, 51, 1)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgba(255, 87, 51, 1)");
    });

    test("should detect rgba with decimal alpha", () => {
      const result = detectContentType("rgba(255, 87, 51, 0.8)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgba(255, 87, 51, 0.8)");
    });

    test("should detect rgba with 0 alpha", () => {
      const result = detectContentType("rgba(255, 87, 51, 0)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("rgba(255, 87, 51, 0)");
    });

    test("should detect rgba with uppercase", () => {
      const result = detectContentType("RGBA(255, 87, 51, 0.5)");
      expect(result.type).toBe("color");
    });

    test("should detect rgba with no spaces", () => {
      const result = detectContentType("rgba(255,87,51,0.8)");
      expect(result.type).toBe("color");
    });
  });

  describe("HSL Colors", () => {
    test("should detect hsl with standard values", () => {
      const result = detectContentType("hsl(9, 100%, 60%)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsl(9, 100%, 60%)");
    });

    test("should detect hsl with 0 values", () => {
      const result = detectContentType("hsl(0, 0%, 0%)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsl(0, 0%, 0%)");
    });

    test("should detect hsl with 360 hue", () => {
      const result = detectContentType("hsl(360, 100%, 50%)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsl(360, 100%, 50%)");
    });

    test("should detect hsl with uppercase", () => {
      const result = detectContentType("HSL(9, 100%, 60%)");
      expect(result.type).toBe("color");
    });

    test("should detect hsl with no spaces", () => {
      const result = detectContentType("hsl(9,100%,60%)");
      expect(result.type).toBe("color");
    });

    test("should NOT detect hsl without % signs", () => {
      const result = detectContentType("hsl(9, 100, 60)");
      expect(result.type).not.toBe("color");
    });
  });

  describe("HSLA Colors", () => {
    test("should detect hsla with standard values", () => {
      const result = detectContentType("hsla(9, 100%, 60%, 0.8)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsla(9, 100%, 60%, 0.8)");
    });

    test("should detect hsla with integer alpha", () => {
      const result = detectContentType("hsla(9, 100%, 60%, 1)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsla(9, 100%, 60%, 1)");
    });

    test("should detect hsla with 0 alpha", () => {
      const result = detectContentType("hsla(9, 100%, 60%, 0)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("hsla(9, 100%, 60%, 0)");
    });

    test("should detect hsla with uppercase", () => {
      const result = detectContentType("HSLA(9, 100%, 60%, 0.8)");
      expect(result.type).toBe("color");
    });
  });

  describe("Named Colors", () => {
    const namedColors = [
      "red", "blue", "green", "yellow", "orange", "purple", "pink",
      "black", "white", "gray", "grey", "brown", "cyan", "magenta",
      "lime", "navy", "maroon", "olive", "teal", "aqua", "silver", "gold"
    ];

    namedColors.forEach((color) => {
      test(`should detect named color: ${color}`, () => {
        const result = detectContentType(color);
        expect(result.type).toBe("color");
        expect(result.value).toBe(color);
      });

      test(`should detect named color uppercase: ${color.toUpperCase()}`, () => {
        const result = detectContentType(color.toUpperCase());
        expect(result.type).toBe("color");
        expect(result.value).toBe(color);
      });

      test(`should detect named color mixed case: ${color.charAt(0).toUpperCase() + color.slice(1)}`, () => {
        const result = detectContentType(color.charAt(0).toUpperCase() + color.slice(1));
        expect(result.type).toBe("color");
        expect(result.value).toBe(color);
      });
    });

    test("should NOT detect invalid named color", () => {
      const result = detectContentType("invalidcolor");
      expect(result.type).not.toBe("color");
    });
  });

  describe("OKLCH Colors", () => {
    test("should detect oklch with standard values", () => {
      const result = detectContentType("oklch(0.6 0.15 30)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("oklch(0.6 0.15 30)");
    });

    test("should detect oklch with alpha", () => {
      const result = detectContentType("oklch(0.6 0.15 30 / 0.8)");
      expect(result.type).toBe("color");
    });

    test("should detect oklch with percentage lightness", () => {
      const result = detectContentType("oklch(60% 0.15 30)");
      expect(result.type).toBe("color");
    });

    test("should detect oklch with uppercase", () => {
      const result = detectContentType("OKLCH(0.6 0.15 30)");
      expect(result.type).toBe("color");
    });
  });

  describe("OKLAB Colors", () => {
    test("should detect oklab with standard values", () => {
      const result = detectContentType("oklab(0.6 0.1 0.05)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("oklab(0.6 0.1 0.05)");
    });

    test("should detect oklab with negative values", () => {
      const result = detectContentType("oklab(0.6 -0.1 0.05)");
      expect(result.type).toBe("color");
    });

    test("should detect oklab with alpha", () => {
      const result = detectContentType("oklab(0.6 0.1 0.05 / 0.8)");
      expect(result.type).toBe("color");
    });

    test("should detect oklab with uppercase", () => {
      const result = detectContentType("OKLAB(0.6 0.1 0.05)");
      expect(result.type).toBe("color");
    });
  });

  describe("LAB Colors", () => {
    test("should detect lab with standard values", () => {
      const result = detectContentType("lab(60 40 30)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("lab(60 40 30)");
    });

    test("should detect lab with negative values", () => {
      const result = detectContentType("lab(60 -40 30)");
      expect(result.type).toBe("color");
    });

    test("should detect lab with alpha", () => {
      const result = detectContentType("lab(60 40 30 / 0.8)");
      expect(result.type).toBe("color");
    });

    test("should detect lab with percentage", () => {
      const result = detectContentType("lab(60% 40 30)");
      expect(result.type).toBe("color");
    });
  });

  describe("LCH Colors", () => {
    test("should detect lch with standard values", () => {
      const result = detectContentType("lch(60 50 180)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("lch(60 50 180)");
    });

    test("should detect lch with alpha", () => {
      const result = detectContentType("lch(60 50 180 / 0.8)");
      expect(result.type).toBe("color");
    });

    test("should detect lch with percentage", () => {
      const result = detectContentType("lch(60% 50 180)");
      expect(result.type).toBe("color");
    });
  });

  describe("Color Function", () => {
    test("should detect color() with srgb", () => {
      const result = detectContentType("color(srgb 1 0.5 0)");
      expect(result.type).toBe("color");
      expect(result.value).toBe("color(srgb 1 0.5 0)");
    });

    test("should detect color() with display-p3", () => {
      const result = detectContentType("color(display-p3 1 0.5 0)");
      expect(result.type).toBe("color");
    });

    test("should detect color() with alpha", () => {
      const result = detectContentType("color(srgb 1 0.5 0 / 0.8)");
      expect(result.type).toBe("color");
    });

    test("should detect color() with rec2020", () => {
      const result = detectContentType("color(rec2020 1 0.5 0)");
      expect(result.type).toBe("color");
    });

    test("should detect color() with xyz", () => {
      const result = detectContentType("color(xyz 0.5 0.3 0.2)");
      expect(result.type).toBe("color");
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty string", () => {
      const result = detectContentType("");
      expect(result.type).toBe("text");
    });

    test("should handle whitespace only", () => {
      const result = detectContentType("   ");
      expect(result.type).toBe("text");
    });

    test("should trim whitespace before detection", () => {
      const result = detectContentType("  #FF5733  ");
      expect(result.type).toBe("color");
      expect(result.value).toBe("#FF5733");
    });

    test("should NOT detect partial hex codes", () => {
      const result = detectContentType("FF");
      expect(result.type).not.toBe("color");
    });

    test("should NOT detect color in sentence", () => {
      const result = detectContentType("The color is #FF5733");
      expect(result.type).not.toBe("color");
    });
  });

  describe("URL vs Color Disambiguation", () => {
    test("should detect color before checking URL", () => {
      const result = detectContentType("FF5733");
      expect(result.type).toBe("color");
    });

    test("should detect actual URLs as URLs", () => {
      const result = detectContentType("https://example.com");
      expect(result.type).toBe("url");
    });

    test("should detect www URLs as URLs", () => {
      const result = detectContentType("www.example.com");
      expect(result.type).toBe("url");
    });
  });

  describe("Normalization", () => {
    test("should normalize hex without # to have #", () => {
      const result = detectContentType("FF5733");
      expect(result.value).toBe("#FF5733");
    });

    test("should preserve # in hex colors", () => {
      const result = detectContentType("#FF5733");
      expect(result.value).toBe("#FF5733");
    });

    test("should normalize named colors to lowercase", () => {
      const result = detectContentType("RED");
      expect(result.value).toBe("red");
    });

    test("should preserve case in rgb/rgba/hsl/hsla", () => {
      const result = detectContentType("RGB(255, 87, 51)");
      expect(result.value).toBe("RGB(255, 87, 51)");
    });
  });
});

