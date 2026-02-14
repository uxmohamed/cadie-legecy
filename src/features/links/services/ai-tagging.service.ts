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
}

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
  if (!Array.isArray(obj.tags)) return null;
  const tags = obj.tags
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, ""))
    .filter((t) => t.length > 0 && t.split(/\s+/).length <= 2);

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

/**
 * Service for generating AI tags and categories for links.
 * Uses Gemini as primary, OpenAI as fallback.
 */
export class AITaggingService {
  private readonly TIMEOUT_MS = 5000;
  private readonly MAX_RETRIES = 2;

  /**
   * Generate tags and category for a link.
   * Returns null if all providers fail (best-effort).
   */
  async generateTags(context: TaggingContext): Promise<TaggingResult | null> {
    const userPrompt = buildUserPrompt(context);
    if (!userPrompt.trim()) return null;

    // Try Gemini first
    const geminiResult = await this.tryGemini(userPrompt);
    if (geminiResult) return geminiResult;

    // Fallback to OpenAI
    const openaiResult = await this.tryOpenAI(userPrompt);
    if (openaiResult) return openaiResult;

    log.warn("[AI Tagging] All providers failed", { context });
    return null;
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

  private timeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), this.TIMEOUT_MS)
    );
  }
}
