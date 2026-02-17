export type SpaceColor =
  | "blue"
  | "cyan"
  | "teal"
  | "emerald"
  | "lime"
  | "yellow"
  | "amber"
  | "crimson"
  | "pink"
  | "hotPink"
  | "purple"
  | "indigo"
  | "brown"
  | "slate";

export const SPACE_COLORS: Record<SpaceColor, { cssVar: string; label: string }> = {
  blue: { cssVar: "#2783DE", label: "Blue" },
  cyan: { cssVar: "#00D3F2", label: "Cyan" },
  teal: { cssVar: "#30B0C7", label: "Teal" },
  emerald: { cssVar: "#34C759", label: "Emerald" },
  lime: { cssVar: "#BBF451", label: "Lime" },
  yellow: { cssVar: "#FFCB30", label: "Yellow" },
  amber: { cssVar: "#FF9F0A", label: "Amber" },
  crimson: { cssVar: "#FF3B30", label: "Crimson" },
  pink: { cssVar: "#EF95C2", label: "Pink" },
  hotPink: { cssVar: "#FF2D55", label: "Hot Pink" },
  purple: { cssVar: "#A684FF", label: "Purple" },
  indigo: { cssVar: "#5856D6", label: "Indigo" },
  brown: { cssVar: "#A2845E", label: "Brown" },
  slate: { cssVar: "#64748B", label: "Slate" },
};
