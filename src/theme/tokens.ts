import { getSemanticTokens } from "./semantic";
import { primitives } from "./primitives";

export interface ThemeTokens {
  readonly [cssVarName: string]: string;
}

export interface ThemeDefinitionMap {
  readonly [themeName: string]: ThemeTokens;
}

// Flatten the tokens for CSS generation
const flattenTokens = (tokens: Record<string, string>) => {
  const result: Record<string, string> = {};
  Object.entries(tokens).forEach(([key, value]) => {
    result[`--${key}`] = value;
  });
  return result;
};

// Flatten palette for legacy/direct usage if needed, or just expose it
// We'll expose the semantic tokens as the main theme
const lightTokens = flattenTokens(getSemanticTokens('light'));
const darkTokens = flattenTokens(getSemanticTokens('dark'));

// Add palette variables if we want them available directly (e.g. --grey-100)
// The original file had them. Let's add them back to ensure backward compatibility.
const addPaletteToTheme = (themeTokens: Record<string, string>) => {
  const p = primitives;
  const result = { ...themeTokens };

  // Helper to add nested objects
  const add = (prefix: string, obj: Record<string, string>) => {
    Object.entries(obj).forEach(([key, value]) => {
      result[`--${prefix}-${key}`] = value;
    });
  };

  // Base
  result["--white"] = p.base.white;
  result["--black"] = p.base.black;

  // Scales
  add("grey", p.grey);
  add("cadie-color", p.cadie);
  add("green", p.green);
  add("yellow", p.yellow);
  add("red", p.red);
  add("opacity", p.opacity);

  // Filter definitions (hardcoded in original, let's keep them)
  result["--filter-dark-card-bg"] = "none";
  result["--filter-dark-lock-icon"] = "none";
  result["--filter-dark-icon"] = "none";
  result["--filter-white-icon-dark"] = "none";
  
  result["--filter-red-icon"] = "brightness(0) saturate(100 percent) invert(31 percent) sepia(99 percent) saturate(2878 percent) hue-rotate(332deg) brightness(96 percent) contrast(100 percent)";
  result["--filter-green-icon"] = "brightness(0) saturate(100 percent) invert(50 percent) sepia(12 percent) saturate(2577 percent) hue-rotate(84deg) brightness(103 percent) contrast(85 percent)";
  result["--filter-purple-icon"] = "brightness(0) saturate(100 percent) invert(35 percent) sepia(100 percent) saturate(569 percent) hue-rotate(270deg) brightness(95 percent) contrast(90 percent)";

  // Misc specific tokens from original
  result["--primary-button-hover-shadow"] = "0 1px 0 oklch(0 0 0 / 0.1)";
  result["--primary-button-hover-inset-shadow"] = "inset 0 1px 0 oklch(1 0 0 / 0.03)";

  result["--card-box-shadow"] = "0 0 32px 13px oklch(0 0 0 / 0.07)";
  result["--editor-page-shadow"] = "60 64 67 / 15 percent 0 1px 3px 1px";
  result["--tab-active-shadow"] = "0 123 255 / 25 percent";

  // Add inferred palette colors that were used in semantic but maybe not in original scales
  // We added orange, pink, darkBlue to palette.ts. Let's expose them.


  return result;
};

export const theme: ThemeDefinitionMap = {
  light: addPaletteToTheme(lightTokens),
  dark: addPaletteToTheme(darkTokens),
};

export type ThemeName = keyof typeof theme;

export const defaultThemeName: ThemeName = "light";
