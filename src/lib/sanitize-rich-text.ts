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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

function fallbackToPlainText(html: string): string {
  return escapeHtml(html.replace(/<[^>]*>/g, ""));
}

function hasHighlightStyle(element: Element): boolean {
  const style = element.getAttribute("style")?.toLowerCase() || "";
  return style.includes("background") || style.includes("hilitecolor");
}

function sanitizeNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (DROP_TAGS.has(tagName)) {
    return null;
  }

  const targetTag = (tagName === "span" || tagName === "font") && hasHighlightStyle(element)
    ? "mark"
    : tagName;

  if (!ALLOWED_TAGS.has(targetTag)) {
    const fragment = doc.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, doc);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    });
    return fragment;
  }

  const sanitizedElement = doc.createElement(targetTag);

  if (targetTag === "a") {
    const href = sanitizeHref(element.getAttribute("href"));
    if (href) {
      sanitizedElement.setAttribute("href", href);
    }

    if (element.getAttribute("target") === "_blank") {
      sanitizedElement.setAttribute("target", "_blank");
      sanitizedElement.setAttribute("rel", "noopener noreferrer");
    }
  }

  Array.from(element.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, doc);
    if (sanitizedChild) {
      sanitizedElement.appendChild(sanitizedChild);
    }
  });

  return sanitizedElement;
}

export function sanitizeRichTextHtml(html: string | null | undefined): string {
  if (!html) return "";

  if (typeof document === "undefined") {
    return fallbackToPlainText(html);
  }

  const doc = document.implementation.createHTMLDocument("");
  const input = doc.createElement("div");
  input.innerHTML = html;

  const output = doc.createElement("div");
  Array.from(input.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, doc);
    if (sanitizedChild) {
      output.appendChild(sanitizedChild);
    }
  });

  return output.innerHTML;
}
