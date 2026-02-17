import fs from "node:fs";
import path from "node:path";
import { parseBookmarkHtml, parseBookmarkHtmlDetailed } from "@/features/imports/parsers/bookmark-html.server";

function loadFixture(name: string): string {
  const fixturePath = path.join(process.cwd(), "src/__tests__/fixtures/bookmarks", name);
  return fs.readFileSync(fixturePath, "utf-8");
}

describe("bookmark HTML parser", () => {
  const browserCases = [
    {
      name: "Chrome",
      fixture: "chrome-sample.html",
      expected: {
        total: 6,
        invalid: 2,
        folders: ["Reading", "Work"],
        sampleLength: 6,
      },
    },
    {
      name: "Firefox",
      fixture: "firefox-sample.html",
      expected: {
        total: 6,
        invalid: 2,
        folders: ["Recipes", "Toolbar"],
        sampleLength: 6,
      },
    },
    {
      name: "Edge",
      fixture: "edge-sample.html",
      expected: {
        total: 6,
        invalid: 2,
        folders: ["Reading", "Work"],
        sampleLength: 6,
      },
    },
    {
      name: "Safari",
      fixture: "safari-sample.html",
      expected: {
        total: 6,
        invalid: 2,
        folders: ["Favorites", "Travel"],
        sampleLength: 6,
      },
    },
  ] as const;

  it.each(browserCases)(
    "parses preview counts, sample links, and top-level folders for %s export",
    ({ fixture, expected }) => {
      const html = loadFixture(fixture);
      const preview = parseBookmarkHtml(html);

      expect(preview.total_links).toBe(expected.total);
      expect(preview.invalid_links).toBe(expected.invalid);
      expect(preview.top_level_folders).toEqual(expected.folders);
      expect(preview.sample_links).toHaveLength(expected.sampleLength);
    }
  );

  it("keeps nested folder paths while resolving top-level folder mapping", () => {
    const html = loadFixture("chrome-sample.html");
    const parsed = parseBookmarkHtmlDetailed(html);

    const nested = parsed.links.find((link) => link.url === "https://nested.example.com/page");
    expect(nested).toBeDefined();
    expect(nested?.topLevelFolder).toBe("Work");
    expect(nested?.folderPath).toEqual(["Work", "Deep"]);

    const root = parsed.links.find((link) => link.url === "https://root.example.com");
    expect(root).toBeDefined();
    expect(root?.topLevelFolder).toBeNull();
    expect(root?.folderPath).toEqual([]);
  });

  it.each([
    {
      fixture: "firefox-sample.html",
      nestedUrl: "https://developer.mozilla.org",
      expectedTopLevelFolder: "Toolbar",
      expectedPath: ["Toolbar", "Dev"],
      rootUrl: "https://root-firefox.example.com",
    },
    {
      fixture: "edge-sample.html",
      nestedUrl: "https://azure.microsoft.com",
      expectedTopLevelFolder: "Work",
      expectedPath: ["Work", "Tools"],
      rootUrl: "https://root-edge.example.com",
    },
    {
      fixture: "safari-sample.html",
      nestedUrl: "https://webkit.org",
      expectedTopLevelFolder: "Favorites",
      expectedPath: ["Favorites", "Research"],
      rootUrl: "https://root-safari.example.com",
    },
  ])("resolves nested and root folder mapping for $fixture", ({
    fixture,
    nestedUrl,
    expectedTopLevelFolder,
    expectedPath,
    rootUrl,
  }) => {
    const html = loadFixture(fixture);
    const parsed = parseBookmarkHtmlDetailed(html);

    const nested = parsed.links.find((link) => link.url === nestedUrl);
    expect(nested).toBeDefined();
    expect(nested?.topLevelFolder).toBe(expectedTopLevelFolder);
    expect(nested?.folderPath).toEqual(expectedPath);

    const root = parsed.links.find((link) => link.url === rootUrl);
    expect(root).toBeDefined();
    expect(root?.topLevelFolder).toBeNull();
    expect(root?.folderPath).toEqual([]);
  });
});
