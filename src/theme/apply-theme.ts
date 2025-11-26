import { theme } from "./colors";

export type ThemeName = keyof typeof theme;

export function applyTheme(name: ThemeName): void {
  if (typeof document === "undefined") return;

  const selected = theme[name];

  Object.entries(selected).forEach(([cssVar, value]) => {
    document.documentElement.style.setProperty(cssVar, value);
  });
}
