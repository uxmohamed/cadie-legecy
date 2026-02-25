/**
 * Creates Figma Variables for Cadie's design token system.
 * Two modes: Light + Dark
 *
 * Usage:
 *   FIGMA_TOKEN=<your-token> node scripts/create-figma-variables.mjs
 *
 * Get a token at: https://www.figma.com/settings (under Personal Access Tokens)
 * Required scope: File content (write)
 */

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = "BhKutuWRa8ASr4Zh2MiKf4";

if (!FIGMA_TOKEN) {
  console.error("❌  Missing FIGMA_TOKEN environment variable.");
  console.error("    Run: FIGMA_TOKEN=<your-token> node scripts/create-figma-variables.mjs");
  process.exit(1);
}

// ─── Color Conversion ────────────────────────────────────────────────────────

/** OKLCH → sRGB (0–1 range each channel) */
function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bv = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  function gamma(c) {
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  return { r: gamma(r), g: gamma(g), b: gamma(bv), a: 1 };
}

/** Solid OKLCH color (no transparency) */
function oklch(L, C, H) {
  return oklchToRgb(L, C, H);
}

/** color-mix(in oklab, COLOR pct%, transparent) */
function mix(L, C, H, pct) {
  const base = oklchToRgb(L, C, H);
  return { r: base.r, g: base.g, b: base.b, a: pct / 100 };
}

/** Shorthand: black at X% opacity */
function black(pct) { return { r: 0, g: 0, b: 0, a: pct / 100 }; }

/** Shorthand: white at X% opacity */
function white(pct) { return { r: 1, g: 1, b: 1, a: pct / 100 }; }

// ─── Token Definitions ───────────────────────────────────────────────────────
// Each entry: [tokenName, lightValue, darkValue]
// Values are { r, g, b, a } with channels in 0–1 range.

const TOKENS = [
  // ── Backgrounds ──────────────────────────────────────────────────────────
  ["bg/default",       oklch(0.98, 0, 0),      oklch(0.13, 0, 0)],
  ["bg/surface",       oklch(1,    0, 0),      oklch(0.18, 0, 0)],
  ["bg/elevated",      oklch(1,    0, 0),      oklch(0.309, 0, 0)],
  ["bg/muted",         black(4),               white(6)],
  ["bg/emphasis",      black(8),               white(10)],
  ["bg/inverse",       oklch(0.13, 0, 0),      oklch(1, 0, 0)],
  ["bg/overlay",       oklch(0.13, 0, 0),      oklch(0.13, 0, 0)],
  ["bg/scrim",         black(50),              black(60)],
  ["bg/hover",         black(8),               white(12)],
  ["bg/active",        black(8),               white(12)],
  ["bg/selected",      black(6),               white(8)],
  ["bg/input",         black(6),               white(8)],
  ["bg/field-light",   black(4),               white(6)],
  ["bg/field-hover",   black(8),               white(12)],

  // ── Foreground / Text ────────────────────────────────────────────────────
  ["fg/default",               oklch(0, 0, 0),      oklch(1, 0, 0)],
  ["fg/muted",                 black(57),            white(60)],
  ["fg/subtle",                black(44),            white(56)],
  ["fg/disabled",              black(34),            white(27)],
  ["fg/inverse",               oklch(1, 0, 0),      oklch(0, 0, 0)],
  ["fg/on-accent",             oklch(1, 0, 0),      oklch(1, 0, 0)],
  ["fg/on-overlay",            oklch(1, 0, 0),      oklch(1, 0, 0)],
  ["fg/on-overlay-muted",      white(56),            white(56)],

  // ── Borders ──────────────────────────────────────────────────────────────
  ["border/default",           black(12),            white(12)],
  ["border/primary",           black(12),            white(12)],
  ["border/muted",             black(8),             white(8)],
  ["border/emphasis",          black(48),            white(32)],
  ["border/hover",             black(24),            white(20)],
  ["border/overlay",           white(16),            white(16)],
  ["border/destructive",       mix(0.569, 0.209, 27.1, 12),  mix(0.77, 0.136, 20.7, 12)],

  // ── Accents ───────────────────────────────────────────────────────────────
  ["accent/default",           oklch(0.604, 0.161, 252.3),   oklch(0.604, 0.161, 252.3)],
  ["accent/hover",             oklch(0.518, 0.138, 252.3),   oklch(0.691, 0.148, 252.3)],
  ["accent/muted",             mix(0.604, 0.161, 252.3, 12), mix(0.604, 0.161, 252.3, 16)],
  ["destructive/default",      oklch(0.676, 0.212, 24.8),    oklch(0.676, 0.212, 24.8)],
  ["destructive/hover",        oklch(0.445, 0.177, 28.5),    oklch(0.569, 0.209, 27.1)],
  ["destructive/muted",        mix(0.77, 0.136, 20.7, 36),   mix(0.77, 0.136, 20.7, 36)],
  ["success/default",          oklch(0.62, 0.151, 155.9),    oklch(0.62, 0.151, 155.9)],
  ["success/muted",            mix(0.62, 0.151, 155.9, 12),  mix(0.733, 0.167, 158, 28)],
  ["warning/default",          oklch(0.657, 0.135, 84.7),    oklch(0.657, 0.135, 84.7)],
  ["warning/muted",            mix(0.657, 0.135, 84.7, 12),  mix(0.768, 0.155, 86.2, 48)],

  // ── Buttons / Interactive ────────────────────────────────────────────────
  ["button/primary",           oklch(0.604, 0.161, 252.3),   oklch(0.604, 0.161, 252.3)],
  ["button/primary-hover",     oklch(0.518, 0.138, 252.3),   oklch(0.518, 0.138, 252.3)],
  ["button/neutral",           oklch(0.309, 0, 0),           oklch(0.309, 0, 0)],
  ["button/neutral-hover",     oklch(0.13, 0, 0),            oklch(0.13, 0, 0)],
  ["button/secondary",         black(6),                     white(8)],
  ["button/secondary-hover",   black(10),                    white(14)],
  ["button/ghost-hover",       black(6),                     white(8)],
  ["button/overlay-hover",     white(12),                    white(12)],
  ["ring/default",             oklch(0.604, 0.161, 252.3),   oklch(0.604, 0.161, 252.3)],
  ["ring/offset",              oklch(1, 0, 0),               oklch(0.13, 0, 0)],

  // ── Overlay Tokens ────────────────────────────────────────────────────────
  ["overlay/text-primary",     oklch(1, 0, 0),   oklch(1, 0, 0)],
  ["overlay/text-secondary",   white(56),         white(56)],
  ["overlay/border",           white(16),         white(16)],
  ["overlay/hover",            white(12),         white(12)],
  ["overlay/separator",        white(12),         white(12)],

  // ── Icons ────────────────────────────────────────────────────────────────
  ["icon/secondary",           oklch(0.65, 0, 0), oklch(0.65, 0, 0)],
];

// ─── Figma API ────────────────────────────────────────────────────────────────

async function createFigmaVariables() {
  const collectionId = "temp-collection-colors";
  const lightModeId = "temp-mode-light";
  const darkModeId  = "temp-mode-dark";

  const payload = {
    variableCollections: [
      {
        action: "CREATE",
        id: collectionId,
        name: "Cadie / Colors",
        initialModeId: lightModeId,
      },
    ],
    variableModes: [
      {
        action: "UPDATE",
        id: lightModeId,
        name: "Light",
        variableCollectionId: collectionId,
      },
      {
        action: "CREATE",
        id: darkModeId,
        name: "Dark",
        variableCollectionId: collectionId,
      },
    ],
    variables: TOKENS.map(([name]) => ({
      action: "CREATE",
      id: `temp-var-${name.replace(/[^a-z0-9]/gi, "-")}`,
      name,
      variableCollectionId: collectionId,
      resolvedType: "COLOR",
    })),
    variableModeValues: TOKENS.flatMap(([name, lightVal, darkVal]) => {
      const varId = `temp-var-${name.replace(/[^a-z0-9]/gi, "-")}`;
      return [
        { variableId: varId, modeId: lightModeId, value: lightVal },
        { variableId: varId, modeId: darkModeId,  value: darkVal  },
      ];
    }),
  };

  console.log(`\n🎨  Creating ${TOKENS.length} variables in "Cadie / Colors" collection…`);
  console.log(`    File: https://www.figma.com/design/${FILE_KEY}\n`);

  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/variables`, {
    method: "POST",
    headers: {
      "X-Figma-Token": FIGMA_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌  Figma API error:", res.status, res.statusText);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("✅  Variables created successfully!");
  console.log(`    Collection ID: ${data.meta?.variableCollections?.[collectionId]?.id ?? "(see response)"}`);
  console.log(`\n    Open in Figma: https://www.figma.com/design/${FILE_KEY}\n`);
}

createFigmaVariables();
