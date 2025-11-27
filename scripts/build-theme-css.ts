import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultThemeName, theme } from "../src/theme/tokens";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function buildThemeCss(themes: Record<string, Record<string, string>>): string {
  const lightTokens = themes.light;
  const darkTokens = themes.dark;

  const lightLines = Object.entries(lightTokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  ${key}: ${value};`);

  const darkLines = Object.entries(darkTokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  ${key}: ${value};`);

  return [
    "/* AUTO-GENERATED FILE: do not edit directly.",
    " * Source of truth: src/theme/tokens.ts",
    " */",
    "",
    ":root,",
    "[data-theme='light'] {",
    ...lightLines,
    "}",
    "",
    "[data-theme='dark'] {",
    ...darkLines,
    "}",
    "",
  ].join("\n");
}

function main(): void {
  const appTargetPath = join(__dirname, "..", "src", "theme", "generated-tokens.css");
  const extensionTargetPath = join(__dirname, "..", "extension", "src", "tokens.css");

  const appDir = dirname(appTargetPath);
  const extensionDir = dirname(extensionTargetPath);

  ensureDir(appDir);
  ensureDir(extensionDir);

  const css = buildThemeCss(theme);

  writeFileSync(appTargetPath, css, "utf8");
  writeFileSync(extensionTargetPath, css, "utf8");
}

main();



