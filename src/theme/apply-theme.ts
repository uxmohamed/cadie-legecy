import { theme, type ThemeName } from "./tokens";

export function applyTheme(name: ThemeName): void {
  if (typeof document === "undefined") return;

  const selected = theme[name];

  Object.entries(selected).forEach(([cssVar, value]) => {
    document.documentElement.style.setProperty(cssVar, value);
  });
}
