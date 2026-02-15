import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type {
  AutoForwardingCondition,
  AutoForwardingField,
  AutoForwardingOperator,
} from "@/features/spaces/types/auto-forwarding";

interface ForwardableLink {
  id: string;
  url: string;
  title?: string | null;
  content_type?: string | null;
  description?: string | null;
  domain?: string | null;
}

interface SpaceRow {
  id: string;
  name: string;
  sort_order: number;
}

interface ForwardingPreferences {
  enabled: boolean;
  conditions: AutoForwardingCondition[];
}

const AI_TIMEOUT_MS = 3500;

const SOCIAL_DOMAIN_SPACE_HINTS: Record<string, string[]> = {
  "twitter.com": ["twitter", "x", "tweets", "tweet"],
  "x.com": ["twitter", "x", "tweets", "tweet"],
  "youtube.com": ["youtube", "video", "videos"],
  "youtu.be": ["youtube", "video", "videos"],
  "instagram.com": ["instagram", "insta", "reels"],
  "linkedin.com": ["linkedin", "jobs", "career"],
  "github.com": ["github", "code", "dev"],
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function buildLinkText(link: ForwardableLink): string {
  return normalize(
    [link.title || "", link.url, link.description || "", link.domain || "", link.content_type || ""]
      .filter(Boolean)
      .join(" ")
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export class AutoSpaceForwardingService {
  private openAIClient: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openAIClient = apiKey ? new OpenAI({ apiKey }) : null;
  }

  private async getForwardingPreferences(userId: string): Promise<ForwardingPreferences> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", userId)
      .single();

    const preferences = (data?.preferences || {}) as Record<string, unknown>;
    const value = preferences.auto_space_forwarding;
    const rawConditions = preferences.auto_space_forwarding_conditions;
    const conditions = Array.isArray(rawConditions)
      ? (rawConditions.filter((item): item is AutoForwardingCondition => {
          if (!item || typeof item !== "object") return false;
          const record = item as Record<string, unknown>;
          return (
            typeof record.id === "string" &&
            typeof record.targetSpaceId === "string" &&
            typeof record.field === "string" &&
            typeof record.operator === "string" &&
            typeof record.value === "string" &&
            typeof record.join === "string"
          );
        }) as AutoForwardingCondition[])
      : [];

    return { enabled: value !== false, conditions };
  }

  private evaluateCondition(
    link: ForwardableLink,
    condition: AutoForwardingCondition
  ): boolean {
    const getFieldValue = (field: AutoForwardingField): string => {
      switch (field) {
        case "domain":
          return (link.domain || getDomain(link.url)).toLowerCase();
        case "url":
          return link.url.toLowerCase();
        case "title":
          return (link.title || "").toLowerCase();
        case "description":
          return (link.description || "").toLowerCase();
        case "contentType":
          return (link.content_type || "").toLowerCase();
        default:
          return "";
      }
    };

    const sourceValue = getFieldValue(condition.field);
    const conditionValue = condition.value.toLowerCase().trim();
    if (!sourceValue || !conditionValue) return false;

    const evaluate = (operator: AutoForwardingOperator): boolean => {
      if (operator === "equals") {
        return sourceValue === conditionValue;
      }

      return sourceValue.includes(conditionValue);
    };

    return evaluate(condition.operator);
  }

  private pickRuleBasedSpace(
    link: ForwardableLink,
    spaces: SpaceRow[],
    conditions: AutoForwardingCondition[]
  ): SpaceRow | null {
    if (conditions.length === 0) return null;

    const groupedConditions = new Map<string, AutoForwardingCondition[]>();
    for (const condition of conditions) {
      const existing = groupedConditions.get(condition.targetSpaceId) || [];
      existing.push(condition);
      groupedConditions.set(condition.targetSpaceId, existing);
    }

    const candidateSpaces = spaces.slice(1);
    for (const space of candidateSpaces) {
      const rules = groupedConditions.get(space.id);
      if (!rules || rules.length === 0) continue;

      let matches = this.evaluateCondition(link, rules[0]);

      for (let index = 1; index < rules.length; index += 1) {
        const rule = rules[index];
        const currentMatch = this.evaluateCondition(link, rule);
        if (rule.join === "AND") {
          matches = matches && currentMatch;
        } else {
          matches = matches || currentMatch;
        }
      }

      if (matches) {
        return space;
      }
    }

    return null;
  }

  private async getUserSpaces(userId: string): Promise<SpaceRow[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("spaces")
      .select("id, name, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    return (data || []) as SpaceRow[];
  }

  private pickHeuristicSpace(link: ForwardableLink, spaces: SpaceRow[]): SpaceRow | null {
    if (spaces.length <= 1) return null;

    const spaceCandidates = spaces.slice(1); // skip mandatory primary space
    const linkText = buildLinkText(link);
    const domain = getDomain(link.url);

    let best: { space: SpaceRow; score: number } | null = null;

    for (const space of spaceCandidates) {
      const tokens = tokenize(space.name);
      let score = 0;

      for (const token of tokens) {
        if (!token || token.length < 2) continue;

        if (linkText.includes(` ${token} `) || linkText.startsWith(`${token} `) || linkText.endsWith(` ${token}`)) {
          score += 6;
        } else if (linkText.includes(token)) {
          score += 3;
        }
      }

      if (domain) {
        const hints = SOCIAL_DOMAIN_SPACE_HINTS[domain] || [];
        if (hints.some((hint) => tokens.includes(hint) || normalize(space.name).includes(hint))) {
          score += 18;
        }

        if (normalize(space.name).includes(domain.split(".")[0])) {
          score += 14;
        }
      }

      if (score > 0 && (!best || score > best.score)) {
        best = { space, score };
      }
    }

    if (!best || best.score < 8) return null;
    return best.space;
  }

  private async pickAISpace(link: ForwardableLink, spaces: SpaceRow[]): Promise<SpaceRow | null> {
    if (!this.openAIClient || spaces.length <= 1) return null;

    const candidates = spaces.slice(1).map((space) => ({
      id: space.id,
      name: space.name,
    }));

    const prompt = `Decide whether this saved item should be auto-forwarded to ONE existing user space.\n` +
      `Return JSON only with: {"spaceId": string|null}.\n` +
      `Choose null when no specific match is strong.\n` +
      `Item: ${JSON.stringify({
        title: link.title,
        url: link.url,
        description: link.description,
        contentType: link.content_type,
      })}\n` +
      `Spaces: ${JSON.stringify(candidates)}`;

    try {
      const completion = await Promise.race([
        this.openAIClient.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0,
          messages: [
            {
              role: "system",
              content: "You are a strict router that maps content to the best matching destination space.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 80,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_TIMEOUT_MS)),
      ]);

      if (!completion) return null;

      const text = completion.choices[0]?.message?.content;
      if (!text) return null;
      const parsed = JSON.parse(text) as { spaceId?: string | null };
      if (!parsed.spaceId) return null;

      return spaces.find((space) => space.id === parsed.spaceId) || null;
    } catch {
      return null;
    }
  }

  async forwardLinks(
    userId: string,
    links: ForwardableLink[]
  ): Promise<{ forwardedSpaceNames: string[]; forwardedByLinkId: Record<string, string | undefined> }> {
    if (links.length === 0) {
      return { forwardedSpaceNames: [], forwardedByLinkId: {} };
    }

    const preferences = await this.getForwardingPreferences(userId);
    if (!preferences.enabled) {
      return { forwardedSpaceNames: [], forwardedByLinkId: {} };
    }

    const spaces = await this.getUserSpaces(userId);
    if (spaces.length <= 1) {
      return { forwardedSpaceNames: [], forwardedByLinkId: {} };
    }

    const supabase = await createClient();
    const insertedSpaceNames = new Set<string>();
    const forwardedByLinkId: Record<string, string | undefined> = {};

    for (const link of links) {
      let target = this.pickRuleBasedSpace(link, spaces, preferences.conditions);
      if (!target) {
        target = this.pickHeuristicSpace(link, spaces);
      }
      if (!target) {
        target = await this.pickAISpace(link, spaces);
      }
      if (!target) continue;

      const { data: existing } = await supabase
        .from("link_spaces")
        .select("id")
        .eq("link_id", link.id)
        .eq("space_id", target.id)
        .maybeSingle();

      if (existing) {
        continue;
      }

      const { error } = await supabase.from("link_spaces").insert({
        link_id: link.id,
        space_id: target.id,
      });

      if (!error) {
        insertedSpaceNames.add(target.name);
        forwardedByLinkId[link.id] = target.name;
      }
    }

    return {
      forwardedSpaceNames: [...insertedSpaceNames],
      forwardedByLinkId,
    };
  }
}
