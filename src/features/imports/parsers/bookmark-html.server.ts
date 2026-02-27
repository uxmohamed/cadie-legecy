import { load } from "cheerio";
import type { BookmarkImportLink, BookmarkPreview } from "@/features/imports/types/import.types";

interface ParseAccumulator {
  links: BookmarkImportLink[];
  totalLinks: number;
  invalidLinks: number;
  topLevelFolders: Set<string>;
}

const SAMPLE_LINK_LIMIT = 20;

export interface ParsedBookmarkHtml {
  links: BookmarkImportLink[];
  total_links: number;
  invalid_links: number;
  top_level_folders: string[];
  sample_links: BookmarkImportLink[];
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeFolderName(input: string): string {
  const cleaned = input.replace(/\s+/g, " ").trim();
  return cleaned || "Untitled Folder";
}

function normalizeTitle(input: string, fallbackUrl: string): string {
  const cleaned = input.replace(/\s+/g, " ").trim();
  return cleaned || fallbackUrl;
}

function isTagElement(node: unknown): boolean {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "tag";
}

function processContainer(
  $: ReturnType<typeof load>,
  element: unknown,
  folderStack: string[],
  acc: ParseAccumulator
): void {
  const children = $(element as never)
    .contents()
    .toArray()
    .filter(isTagElement);

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    const tag = $(node as never).prop("tagName")?.toLowerCase();

    if (!tag) continue;

    if (tag === "dt") {
      const dt = $(node as never);
      const anchor = dt.children("a").first();
      const folderHeading = dt.children("h3").first();

      if (anchor.length > 0) {
        const href = (anchor.attr("href") || "").trim();
        if (!href) continue;

        const topLevelFolder = folderStack.length > 0 ? folderStack[0] : null;
        const title = normalizeTitle(anchor.text(), href);

        acc.totalLinks += 1;
        if (!isHttpUrl(href)) {
          acc.invalidLinks += 1;
        }

        if (topLevelFolder) {
          acc.topLevelFolders.add(topLevelFolder);
        }

        acc.links.push({
          url: href,
          title,
          topLevelFolder,
          folderPath: [...folderStack],
        });
        continue;
      }

      if (folderHeading.length > 0) {
        const folderName = normalizeFolderName(folderHeading.text());
        const nestedWithinDt = dt.children("dl").first();
        const nestedWithinDtNode = nestedWithinDt.get(0);
        if (nestedWithinDtNode) {
          processContainer($, nestedWithinDtNode, [...folderStack, folderName], acc);
          continue;
        }

        const next = children[i + 1];
        const nextTag = next ? $(next as never).prop("tagName")?.toLowerCase() : undefined;

        if (next && (nextTag === "dl" || nextTag === "p")) {
          processContainer($, next, [...folderStack, folderName], acc);
          i += 1;
          continue;
        }
      }

      continue;
    }

    if (tag === "dl" || tag === "p" || tag === "div" || tag === "body" || tag === "html") {
      processContainer($, node, folderStack, acc);
    }
  }
}

export function parseBookmarkHtmlDetailed(content: string): ParsedBookmarkHtml {
  const $ = load(content);

  const rootDl = $("dl").first();
  const rootElement = rootDl.get(0) || $("body").get(0) || $("html").get(0);

  const acc: ParseAccumulator = {
    links: [],
    totalLinks: 0,
    invalidLinks: 0,
    topLevelFolders: new Set<string>(),
  };

  if (rootElement) {
    processContainer($, rootElement, [], acc);
  }

  const topLevelFolders = [...acc.topLevelFolders].sort((a, b) => a.localeCompare(b));

  return {
    links: acc.links,
    total_links: acc.totalLinks,
    invalid_links: acc.invalidLinks,
    top_level_folders: topLevelFolders,
    sample_links: acc.links.slice(0, SAMPLE_LINK_LIMIT),
  };
}

export function parseBookmarkHtml(content: string): BookmarkPreview {
  const parsed = parseBookmarkHtmlDetailed(content);
  return {
    total_links: parsed.total_links,
    invalid_links: parsed.invalid_links,
    top_level_folders: parsed.top_level_folders,
    sample_links: parsed.sample_links,
  };
}
