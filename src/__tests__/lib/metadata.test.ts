import { extractMetadata } from "@/lib/metadata";

type MockResponseInit = {
  url: string;
  status?: number;
  headers?: Record<string, string>;
  textBody?: string;
  jsonBody?: unknown;
};

function makeMockResponse({
  url,
  status = 200,
  headers = {},
  textBody = "",
  jsonBody,
}: MockResponseInit): Response {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    } as Headers,
    text: async () => textBody,
    json: async () => jsonBody,
  } as Response;
}

describe("extractMetadata provider fallbacks", () => {
  it("uses Twitter oEmbed content when X page metadata is generic", async () => {
    const tweetUrl = "https://x.com/Ash_uxi/status/2022745048950149414";

    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (requestUrl.includes("publish.twitter.com/oembed")) {
        return makeMockResponse({
          url: requestUrl,
          jsonBody: {
            url: "https://twitter.com/Ash_uxi/status/2022745048950149414",
            author_name: "Ashish",
            provider_name: "Twitter",
            html: `<blockquote><p>experimenting with keeping everything on a single page. open in drawer instead of navigating to new urls. pic.twitter.com/wLr63K9qUf</p></blockquote>`,
          },
        });
      }

      return makeMockResponse({
        url: tweetUrl,
        textBody: `
          <html>
            <head>
              <title>X</title>
              <meta property="og:site_name" content="X (formerly Twitter)" />
            </head>
            <body><main>Log in to X</main></body>
          </html>
        `,
      });
    });

    const metadata = await extractMetadata(tweetUrl);

    expect(metadata.fetch_status).toBe("success");
    expect(metadata.title.toLowerCase()).toContain("experimenting with keeping everything");
    expect(metadata.title).not.toBe("x.com");
    expect(metadata.description).toBeDefined();
    expect(metadata.description?.toLowerCase()).toContain("single page");
    expect(metadata.description || "").not.toContain("pic.twitter.com");
    expect(metadata.canonical_url).toBe("https://twitter.com/Ash_uxi/status/2022745048950149414");
    expect(metadata.content_text).toContain("Author: Ashish");
  });

  it("uses YouTube oEmbed title when page title is generic", async () => {
    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (requestUrl.includes("youtube.com/oembed")) {
        return makeMockResponse({
          url: requestUrl,
          jsonBody: {
            title: "Rick Astley - Never Gonna Give You Up (Official Video)",
            author_name: "Rick Astley",
            provider_name: "YouTube",
            thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          },
        });
      }

      return makeMockResponse({
        url: videoUrl,
        textBody: `
          <html>
            <head>
              <title>YouTube</title>
            </head>
            <body><main>Watch videos</main></body>
          </html>
        `,
      });
    });

    const metadata = await extractMetadata(videoUrl);

    expect(metadata.fetch_status).toBe("success");
    expect(metadata.title).toBe("Rick Astley - Never Gonna Give You Up (Official Video)");
    expect(metadata.description).toBe("Video by Rick Astley on YouTube.");
    expect(metadata.site_name).toBe("YouTube");
    expect(metadata.preview_image_url).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(metadata.canonical_url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("returns provider metadata even when primary fetch is blocked", async () => {
    const tweetUrl = "https://x.com/amasad/status/2022736974545850878";

    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (requestUrl.includes("publish.twitter.com/oembed")) {
        return makeMockResponse({
          url: requestUrl,
          jsonBody: {
            url: "https://twitter.com/amasad/status/2022736974545850878",
            author_name: "Amjad Masad",
            provider_name: "Twitter",
            html: `<blockquote><p>Dario was mid FibonacciGooning when he was FrameMogged by Dwarkesh.</p></blockquote>`,
          },
        });
      }

      return makeMockResponse({
        url: tweetUrl,
        status: 403,
      });
    });

    const metadata = await extractMetadata(tweetUrl);

    expect(metadata.fetch_status).toBe("success");
    expect(metadata.status_code).toBe(403);
    expect(metadata.title).toContain("Dario was mid FibonacciGooning");
    expect(metadata.description).toBeDefined();
    expect(metadata.description || "").toContain("FrameMogged");
    expect(metadata.canonical_url).toBe("https://twitter.com/amasad/status/2022736974545850878");
  });
});
/** @jest-environment node */
