import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { log } from "@/lib/logger";

const VALID_CATEGORIES = [
  "article",
  "tool",
  "video",
  "portfolio",
  "documentation",
  "social-media",
  "shopping",
  "news",
  "reference",
  "other",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

interface TaggingContext {
  title?: string | null;
  description?: string | null;
  domain?: string | null;
  site_name?: string | null;
  content?: string | null;
}

interface TaggingResult {
  tags: string[];
  category: Category;
  title?: string;
  description?: string;
}

interface PreparedImageData {
  mimeType: string;
  dataUrl: string;
}

const IMAGE_SYSTEM_PROMPT = `You are an expert visual content curator and digital librarian. Your goal is to analyze images and categorize them with high precision.
Given an image, generate:

1. 5-10 high-quality, specific tags describing the image content.
   - Rules: lowercase, 1-3 words max, no special characters (use hyphens for spaces).
   - Strategy: Mix broad topics (e.g. "landscape", "portrait") with specific subjects (e.g. "golden-gate-bridge", "sunset") and style descriptors (e.g. "minimalist", "aerial-view").
   - Avoid generic tags like "image", "photo", "picture" unless necessary.
2. Exactly 1 category from this list: article, tool, video, portfolio, documentation, social-media, shopping, news, reference, other.
3. A short title with 3-5 words maximum.
   - Must be concise and scannable.
   - No full-sentence titles.
   - No trailing punctuation.
4. A detailed description in 2-3 sentences, around 35-60 words total.
   - The description should read like a useful summary for a saved media library.
   - Avoid repeating the title verbatim as the first sentence.

Respond ONLY with valid JSON in this exact format:
{"tags": ["tag1", "tag2", "tag3"], "category": "other", "title": "short sample title", "description": "A fuller 2-3 sentence description of the image."}`;

const SYSTEM_PROMPT = `You are an expert content curator and digital librarian. Your goal is to deeply anaylze web content and categorize it with high precision.
Given metadata and a content preview of a link, generate:

1. 5-10 high-quality, specific tags.
   - Rules: lowercase, 1-3 words max, no special characters (use hyphens for spaces).
   - Strategy: Mix broad topics (e.g. "artificial-intelligence") with specific entities (e.g. "openai", "sam-altman") and niche concepts (e.g. "prompt-engineering").
   - Avoid generic tags like "tech", "website", "article" unless necessary.
2. Exactly 1 category from this list: article, tool, video, portfolio, documentation, social-media, shopping, news, reference, other.

Respond ONLY with valid JSON in this exact format:
{"tags": ["tag1", "tag2", "tag3"], "category": "article"}`;

function buildUserPrompt(context: TaggingContext): string {
  const parts: string[] = [];
  if (context.title) parts.push(`Title: ${context.title}`);
  if (context.description) parts.push(`Description: ${context.description}`);
  if (context.domain) parts.push(`Domain: ${context.domain}`);
  if (context.site_name) parts.push(`Site: ${context.site_name}`);
  if (context.content) parts.push(`Content Preview:\n${context.content.substring(0, 2000)}`);
  return parts.join("\n");
}

function validateAndClean(raw: unknown): TaggingResult | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  // Validate tags
  const rawTags = Array.isArray(obj.tags)
    ? obj.tags
    : typeof obj.tags === "string"
      ? obj.tags.split(/[,\n]/)
      : [];
  if (rawTags.length === 0) return null;

  const tags = rawTags
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, ""))
    .map((t) => t.replace(/\s+/g, "-"))
    .filter((t) => t.length > 0 && t.split("-").length <= 3);

  // Dedupe and limit to 10
  const uniqueTags = [...new Set(tags)].slice(0, 10);
  if (uniqueTags.length === 0) return null;

  // Validate category
  const category = String(obj.category || "").toLowerCase().trim() as Category;
  if (!VALID_CATEGORIES.includes(category)) {
    return { tags: uniqueTags, category: "other" };
  }

  return { tags: uniqueTags, category };
}

function normalizeImageTitle(
  rawTitle: unknown,
  fallbackDescription?: string
): string | undefined {
  let title = typeof rawTitle === "string" ? rawTitle : "";

  if (!title && fallbackDescription) {
    const firstSentence = fallbackDescription.split(/[.!?]/)[0] || fallbackDescription;
    title = firstSentence;
  }

  title = title
    .replace(/^(an?|the)\s+/i, "")
    .replace(/^image\s+(of|showing|displaying)\s+/i, "")
    .replace(/^a\s+photo\s+of\s+/i, "")
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) return undefined;

  const shortTitle = title.split(" ").slice(0, 5).join(" ").trim();
  return shortTitle || undefined;
}

function normalizeImageDescription(rawDescription: unknown, title?: string): string | undefined {
  if (typeof rawDescription !== "string") return undefined;

  let description = rawDescription
    .replace(/\s+/g, " ")
    .trim();

  if (!description) return undefined;

  if (title) {
    const lowerTitle = title.toLowerCase();
    if (description.toLowerCase() === lowerTitle) {
      description = `This image highlights ${title.toLowerCase()} with clear visual detail and context for quick reference in your collection.`;
    }
  }

  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount < 22) {
    description = `${description} It captures the main visual elements and context in a way that is useful for search and quick recall.`;
  }

  if (description.length > 500) {
    description = description.slice(0, 500).trim();
  }

  return description;
}

/**
 * Service for generating AI tags and categories for links.
 * Uses Gemini as primary, OpenAI as fallback.
 */
export class AITaggingService {
  private readonly TIMEOUT_MS = 10000;
  private readonly MAX_RETRIES = 2;
  private readonly MAX_IMAGE_BYTES = 8 * 1024 * 1024;

  /**
   * Generate tags and category for a link.
   * Returns deterministic fallback tags if all providers fail.
   */
  async generateTags(context: TaggingContext): Promise<TaggingResult | null> {
    const userPrompt = buildUserPrompt(context);
    if (!userPrompt.trim()) {
      return this.fallbackFromContext(context);
    }

    // Try Gemini first
    const geminiResult = await this.tryGemini(userPrompt);
    if (geminiResult) return geminiResult;

    // Fallback to OpenAI
    const openaiResult = await this.tryOpenAI(userPrompt);
    if (openaiResult) return openaiResult;

    log.warn("[AI Tagging] All providers failed", { context });
    return this.fallbackFromContext(context);
  }

  private async tryGemini(userPrompt: string): Promise<TaggingResult | null> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      log.warn("[AI Tagging] GOOGLE_AI_API_KEY not set, skipping Gemini");
      return null;
    }

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        });

        const result = await Promise.race([
          model.generateContent(`${SYSTEM_PROMPT}\n\n${userPrompt}`),
          this.timeout(),
        ]);

        if (!result) return null;
        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validated = validateAndClean(parsed);
        if (validated) return validated;
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        if (status === 429) {
          log.warn("[AI Tagging] Gemini rate limited, falling back to OpenAI");
          return null; // Don't retry on rate limit, go to fallback
        }
        log.warn(`[AI Tagging] Gemini attempt ${attempt + 1} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  }

  private async tryOpenAI(userPrompt: string): Promise<TaggingResult | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      log.warn("[AI Tagging] OPENAI_API_KEY not set, skipping OpenAI");
      return null;
    }

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const openai = new OpenAI({ apiKey });

        const result = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 200,
          }),
          this.timeout(),
        ]);

        if (!result) return null;
        const text = result.choices[0]?.message?.content;
        if (!text) continue;

        const parsed = JSON.parse(text);
        const validated = validateAndClean(parsed);
        if (validated) return validated;
      } catch (error) {
        log.warn(`[AI Tagging] OpenAI attempt ${attempt + 1} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  }

  /**
   * Generate tags, category, and description from an image URL using vision models.
   * Uses Gemini 2.0 Flash as primary, OpenAI GPT-4o-mini as fallback.
   */
  async generateTagsFromImage(imageUrl: string): Promise<TaggingResult | null> {
    if (!imageUrl) return null;
    const preparedImage = await this.prepareImageForVision(imageUrl);

    // Try Gemini vision first
    const geminiResult = await this.tryGeminiVision(imageUrl, preparedImage);
    if (geminiResult) return geminiResult;

    // Fallback to OpenAI vision
    const openaiResult = await this.tryOpenAIVision(imageUrl, preparedImage);
    if (openaiResult) return openaiResult;

    log.warn("[AI Vision Tagging] All providers failed", { imageUrl });
    return this.fallbackFromImageUrl(imageUrl);
  }

  private async prepareImageForVision(imageUrl: string): Promise<PreparedImageData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      if (!imageResponse.ok) {
        log.warn("[AI Vision Tagging] Failed to fetch image for preprocessing", {
          imageUrl,
          status: imageResponse.status,
        });
        return null;
      }

      const contentLength = Number(imageResponse.headers.get("content-length") || "0");
      if (contentLength > this.MAX_IMAGE_BYTES) {
        log.warn("[AI Vision Tagging] Image too large for inline vision payload", {
          imageUrl,
          contentLength,
          maxBytes: this.MAX_IMAGE_BYTES,
        });
        return null;
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      if (imageBuffer.byteLength > this.MAX_IMAGE_BYTES) {
        log.warn("[AI Vision Tagging] Downloaded image exceeds inline payload limit", {
          imageUrl,
          bytes: imageBuffer.byteLength,
          maxBytes: this.MAX_IMAGE_BYTES,
        });
        return null;
      }

      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
      const base64Data = Buffer.from(imageBuffer).toString("base64");
      return {
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64Data}`,
      };
    } catch (error) {
      log.warn("[AI Vision Tagging] Failed to prepare image payload", {
        imageUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async tryGeminiVision(
    imageUrl: string,
    preparedImage: PreparedImageData | null
  ): Promise<TaggingResult | null> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      log.warn("[AI Vision Tagging] GOOGLE_AI_API_KEY not set, skipping Gemini");
      return null;
    }

    if (!preparedImage) {
      return null;
    }

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        });

        const result = await Promise.race([
          model.generateContent([
            IMAGE_SYSTEM_PROMPT,
            {
              inlineData: {
                mimeType: preparedImage.mimeType,
                data: preparedImage.dataUrl.split(",")[1] || "",
              },
            },
          ]),
          this.visionTimeout(),
        ]);

        if (!result) return null;
        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validated = validateAndClean(parsed);
        if (validated) {
          validated.title = normalizeImageTitle(parsed.title, parsed.description);
          validated.description = normalizeImageDescription(parsed.description, validated.title);
          return validated;
        }
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        if (status === 429) {
          log.warn("[AI Vision Tagging] Gemini rate limited, falling back");
          return null;
        }
        log.warn(`[AI Vision Tagging] Gemini attempt ${attempt + 1} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return null;
  }

  private async tryOpenAIVision(
    imageUrl: string,
    preparedImage: PreparedImageData | null
  ): Promise<TaggingResult | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      log.warn("[AI Vision Tagging] OPENAI_API_KEY not set, skipping OpenAI");
      return null;
    }

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const openai = new OpenAI({ apiKey });
        const result = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: IMAGE_SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: preparedImage?.dataUrl || imageUrl,
                      detail: "low",
                    },
                  },
                  { type: "text", text: "Analyze this image." },
                ],
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 300,
          }),
          this.visionTimeout(),
        ]);

        if (!result) return null;
        const text = result.choices[0]?.message?.content;
        if (!text) continue;

        const parsed = JSON.parse(text);
        const validated = validateAndClean(parsed);
        if (validated) {
          validated.title = normalizeImageTitle(parsed.title, parsed.description);
          validated.description = normalizeImageDescription(parsed.description, validated.title);
          return validated;
        }
      } catch (error) {
        log.warn(`[AI Vision Tagging] OpenAI attempt ${attempt + 1} failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return null;
  }

  private timeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), this.TIMEOUT_MS)
    );
  }

  private visionTimeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI vision request timed out")), 22000)
    );
  }

  private fallbackFromContext(context: TaggingContext): TaggingResult {
    const pieces = [
      context.title,
      context.site_name,
      context.domain?.replace(/\./g, " "),
      context.description?.slice(0, 240),
    ]
      .filter(Boolean)
      .join(" ");

    const tags = this.extractFallbackTags(pieces, 6);
    return {
      tags: tags.length > 0 ? tags : ["web-link"],
      category: "other",
    };
  }

  private fallbackFromImageUrl(imageUrl: string): TaggingResult {
    let fileName = "uploaded image";

    try {
      const url = new URL(imageUrl);
      const pathPart = url.pathname.split("/").pop() || "";
      fileName = decodeURIComponent(pathPart || fileName)
        .replace(/\.[a-zA-Z0-9]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim() || fileName;
    } catch {
      // Keep default fallback
    }

    const tags = this.extractFallbackTags(fileName, 6);
    const titleText = fileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .join(" ");
    const description = titleText
      ? `This image shows ${titleText.toLowerCase()} with clear visual context. It is stored as a quick visual reference for later search and recall.`
      : "Image item saved to library.";

    return {
      tags: tags.length > 0 ? tags : ["image-item"],
      category: "other",
      title: titleText || "Saved image",
      description: normalizeImageDescription(description, titleText),
    };
  }

  private extractFallbackTags(text: string, limit: number): string[] {
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "with",
      "from",
      "this",
      "that",
      "your",
      "into",
      "http",
      "https",
      "www",
      "com",
      "net",
      "org",
      "image",
      "photo",
      "file",
    ]);

    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stopWords.has(token));

    const deduped = [...new Set(tokens)].slice(0, limit);
    return deduped;
  }
}
