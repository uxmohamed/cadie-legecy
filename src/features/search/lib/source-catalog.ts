export interface SourceDefinition {
  id: string;
  label: string;
  domains: string[];
  aliases: string[];
}

export const SOURCE_CATALOG: SourceDefinition[] = [
  {
    id: "twitter",
    label: "Twitter",
    domains: ["twitter.com", "x.com"],
    aliases: ["twitter", "x", "tweet", "tweets", "post", "posts"],
  },
  {
    id: "youtube",
    label: "YouTube",
    domains: ["youtube.com", "youtu.be"],
    aliases: ["youtube", "yt", "video", "videos", "shorts"],
  },
  {
    id: "github",
    label: "GitHub",
    domains: ["github.com", "gist.github.com"],
    aliases: ["github", "repo", "repos", "pull request", "issues"],
  },
  {
    id: "reddit",
    label: "Reddit",
    domains: ["reddit.com"],
    aliases: ["reddit", "subreddit", "reddits"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    domains: ["linkedin.com"],
    aliases: ["linkedin"],
  },
  {
    id: "instagram",
    label: "Instagram",
    domains: ["instagram.com"],
    aliases: ["instagram", "insta", "reel", "reels"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    domains: ["tiktok.com"],
    aliases: ["tiktok", "tik tok"],
  },
  {
    id: "hn",
    label: "Hacker News",
    domains: ["news.ycombinator.com"],
    aliases: ["hacker news", "hn", "ycombinator"],
  },
  {
    id: "medium",
    label: "Medium",
    domains: ["medium.com"],
    aliases: ["medium"],
  },
];

export const SOURCE_BY_ID = new Map(SOURCE_CATALOG.map((source) => [source.id, source]));

export const SOURCE_TERMS = new Set(
  SOURCE_CATALOG.flatMap((source) => [source.id, source.label.toLowerCase(), ...source.aliases])
);
