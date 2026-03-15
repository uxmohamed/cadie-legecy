import { load } from "cheerio";

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "i",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "u",
  "ul",
]);

const DROP_TAGS = new Set(["embed", "iframe", "math", "noscript", "object", "script", "style", "svg"]);

function sanitizeHref(href: string | null): string | null {
  if (!href) return null;

  const trimmed = href.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, "https://cadie.app");
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:") {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

export function sanitizeNoteHtml(html: string | null | undefined): string | null {
  if (!html) return null;

  const $ = load(`<div id="note-root">${html}</div>`);
  const root = $("#note-root");

  root.find("*").each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const current = $(element);

    if (DROP_TAGS.has(tagName)) {
      current.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      current.replaceWith(current.contents());
      return;
    }

    const attributes = { ...element.attribs };
    for (const attributeName of Object.keys(attributes)) {
      current.removeAttr(attributeName);
    }

    if (tagName === "a") {
      const href = sanitizeHref(attributes.href ?? null);
      if (href) {
        current.attr("href", href);
      }

      if (attributes.target === "_blank") {
        current.attr("target", "_blank");
        current.attr("rel", "noopener noreferrer");
      }
    }
  });

  const sanitized = root.html()?.trim() || "";
  return sanitized.length > 0 ? sanitized : null;
}
