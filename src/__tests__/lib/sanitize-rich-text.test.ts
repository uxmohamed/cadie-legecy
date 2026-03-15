import { sanitizeRichTextHtml } from "@/lib/sanitize-rich-text";

describe("sanitizeRichTextHtml", () => {
  it("removes script tags and inline event handlers", () => {
    const sanitized = sanitizeRichTextHtml(
      `<p onclick="alert('xss')">Safe</p><img src="x" onerror="alert('xss')" /><script>alert('xss')</script>`
    );

    expect(sanitized).toBe("<p>Safe</p>");
  });

  it("preserves supported formatting and safe links", () => {
    const sanitized = sanitizeRichTextHtml(
      `<div><strong>Bold</strong> <span style="background-color: rgb(255, 245, 157)">highlight</span> <a href="https://example.com" target="_blank" rel="nofollow">link</a></div>`
    );

    expect(sanitized).toBe(
      '<div><strong>Bold</strong> <mark>highlight</mark> <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a></div>'
    );
  });

  it("drops unsafe javascript URLs", () => {
    const sanitized = sanitizeRichTextHtml(
      `<a href="javascript:alert('xss')">bad</a><a href="/safe">good</a>`
    );

    expect(sanitized).toBe('<a>bad</a><a href="/safe">good</a>');
  });
});
