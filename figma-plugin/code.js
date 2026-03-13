// Cadie – Design System Plugin
//
// Commands:
//   "create" → Create the "Cadie / Colors" variable collection (Light + Dark)
//   "bind"   → Bind every solid fill in the selection to its matching variable

// ─── Color Conversion ────────────────────────────────────────────────────────

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

  const r  =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g  = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bv = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  function gamma(c) {
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  return { r: gamma(r), g: gamma(g), b: gamma(bv), a: 1 };
}

function oklch(L, C, H) { return oklchToRgb(L, C, H); }
function mix(L, C, H, pct) {
  const c = oklchToRgb(L, C, H);
  return { r: c.r, g: c.g, b: c.b, a: pct / 100 };
}
function black(pct) { return { r: 0, g: 0, b: 0, a: pct / 100 }; }
function white(pct) { return { r: 1, g: 1, b: 1, a: pct / 100 }; }

// ─── Token Definitions ───────────────────────────────────────────────────────

const TOKENS = [
  // Backgrounds
  ["bg/default",             oklch(0.98, 0, 0),             oklch(0.13, 0, 0)],
  ["bg/surface",             oklch(1,    0, 0),             oklch(0.18, 0, 0)],
  ["bg/elevated",            oklch(1,    0, 0),             oklch(0.309, 0, 0)],
  ["bg/muted",               black(4),                      white(6)],
  ["bg/emphasis",            black(8),                      white(10)],
  ["bg/inverse",             oklch(0.13, 0, 0),             oklch(1, 0, 0)],
  ["bg/overlay",             oklch(0.13, 0, 0),             oklch(0.13, 0, 0)],
  ["bg/scrim",               black(50),                     black(60)],
  ["bg/hover",               black(8),                      white(12)],
  ["bg/active",              black(8),                      white(12)],
  ["bg/selected",            black(6),                      white(8)],
  ["bg/input",               black(6),                      white(8)],
  ["bg/field-light",         black(4),                      white(6)],
  ["bg/field-hover",         black(8),                      white(12)],
  // Foreground / Text
  ["fg/default",             oklch(0, 0, 0),                oklch(1, 0, 0)],
  ["fg/muted",               black(57),                     white(60)],
  ["fg/subtle",              black(44),                     white(56)],
  ["fg/disabled",            black(34),                     white(27)],
  ["fg/inverse",             oklch(1, 0, 0),                oklch(0, 0, 0)],
  ["fg/on-accent",           oklch(1, 0, 0),                oklch(1, 0, 0)],
  ["fg/on-overlay",          oklch(1, 0, 0),                oklch(1, 0, 0)],
  ["fg/on-overlay-muted",    white(56),                     white(56)],
  // Borders
  ["border/default",         black(12),                     white(12)],
  ["border/primary",         black(12),                     white(12)],
  ["border/muted",           black(8),                      white(8)],
  ["border/emphasis",        black(48),                     white(32)],
  ["border/hover",           black(24),                     white(20)],
  ["border/overlay",         white(16),                     white(16)],
  ["border/destructive",     mix(0.569, 0.209, 27.1, 12),   mix(0.77, 0.136, 20.7, 12)],
  // Accents
  ["accent/default",         oklch(0.604, 0.161, 252.3),    oklch(0.604, 0.161, 252.3)],
  ["accent/hover",           oklch(0.518, 0.138, 252.3),    oklch(0.691, 0.148, 252.3)],
  ["accent/muted",           mix(0.604, 0.161, 252.3, 12),  mix(0.604, 0.161, 252.3, 16)],
  ["destructive/default",    oklch(0.676, 0.212, 24.8),     oklch(0.676, 0.212, 24.8)],
  ["destructive/hover",      oklch(0.445, 0.177, 28.5),     oklch(0.569, 0.209, 27.1)],
  ["destructive/muted",      mix(0.77, 0.136, 20.7, 36),    mix(0.77, 0.136, 20.7, 36)],
  ["success/default",        oklch(0.62, 0.151, 155.9),     oklch(0.62, 0.151, 155.9)],
  ["success/muted",          mix(0.62, 0.151, 155.9, 12),   mix(0.733, 0.167, 158, 28)],
  ["warning/default",        oklch(0.657, 0.135, 84.7),     oklch(0.657, 0.135, 84.7)],
  ["warning/muted",          mix(0.657, 0.135, 84.7, 12),   mix(0.768, 0.155, 86.2, 48)],
  // Buttons / Interactive
  ["button/primary",         oklch(0.604, 0.161, 252.3),    oklch(0.604, 0.161, 252.3)],
  ["button/primary-hover",   oklch(0.518, 0.138, 252.3),    oklch(0.518, 0.138, 252.3)],
  ["button/neutral",         oklch(0.309, 0, 0),            oklch(0.309, 0, 0)],
  ["button/neutral-hover",   oklch(0.13, 0, 0),             oklch(0.13, 0, 0)],
  ["button/secondary",       black(6),                      white(8)],
  ["button/secondary-hover", black(10),                     white(14)],
  ["button/ghost-hover",     black(6),                      white(8)],
  ["button/overlay-hover",   white(12),                     white(12)],
  ["ring/default",           oklch(0.604, 0.161, 252.3),    oklch(0.604, 0.161, 252.3)],
  ["ring/offset",            oklch(1, 0, 0),                oklch(0.13, 0, 0)],
  // Overlay
  ["overlay/text-primary",   oklch(1, 0, 0),                oklch(1, 0, 0)],
  ["overlay/text-secondary", white(56),                     white(56)],
  ["overlay/border",         white(16),                     white(16)],
  ["overlay/hover",          white(12),                     white(12)],
  ["overlay/separator",      white(12),                     white(12)],
  // Icons
  ["icon/secondary",         oklch(0.65, 0, 0),             oklch(0.65, 0, 0)],
];

// ─── Command: Create Color Variables ─────────────────────────────────────────

function createVariables() {
  const existing = figma.variables.getLocalVariableCollections()
    .find(c => c.name === "Cadie / Colors");
  if (existing) {
    existing.remove();
    console.log('Removed existing "Cadie / Colors" collection.');
  }

  const collection = figma.variables.createVariableCollection("Cadie / Colors");
  const lightModeId = collection.modes[0].modeId;
  collection.renameMode(lightModeId, "Light");
  const darkModeId = collection.addMode("Dark");

  for (const [name, lightVal, darkVal] of TOKENS) {
    const variable = figma.variables.createVariable(name, collection, "COLOR");
    variable.setValueForMode(lightModeId, lightVal);
    variable.setValueForMode(darkModeId, darkVal);
  }

  figma.notify(`✅  Created ${TOKENS.length} color variables with Light + Dark modes.`);
  figma.closePlugin();
}

// ─── Command: Bind Variables to Selection ────────────────────────────────────

function bindVariables() {
  // Find the collection
  const collection = figma.variables.getLocalVariableCollections()
    .find(c => c.name === "Cadie / Colors");
  if (!collection) {
    figma.notify('❌  Run "Create Color Variables" first.');
    figma.closePlugin();
    return;
  }

  // Find Light mode
  const lightMode = collection.modes.find(m => m.name === "Light");
  if (!lightMode) {
    figma.notify('❌  "Light" mode not found in the collection.');
    figma.closePlugin();
    return;
  }

  // Build a list of [variable, lightColor] pairs for fast matching
  const cadieVars = figma.variables.getLocalVariables("COLOR")
    .filter(v => v.variableCollectionId === collection.id);

  const varEntries = cadieVars.map(v => {
    const val = v.valuesByMode[lightMode.modeId];
    return { variable: v, color: val };
  }).filter(e => e.color && typeof e.color === "object" && "r" in e.color);

  // Color matching with a small epsilon
  function colorsMatch(a, b, eps = 0.012) {
    const aAlpha = (a.opacity !== undefined ? a.opacity : (a.a !== undefined ? a.a : 1));
    const bAlpha = b.a !== undefined ? b.a : 1;
    return (
      Math.abs(a.r - b.r) < eps &&
      Math.abs(a.g - b.g) < eps &&
      Math.abs(a.b - b.b) < eps &&
      Math.abs(aAlpha - bAlpha) < eps
    );
  }

  function findVariable(fillColor, fillOpacity) {
    const query = { r: fillColor.r, g: fillColor.g, b: fillColor.b, opacity: fillOpacity };
    for (const { variable, color } of varEntries) {
      if (colorsMatch(query, color)) return variable;
    }
    return null;
  }

  let boundCount = 0;
  let visitedCount = 0;

  function traverse(node) {
    visitedCount++;

    // Fills (backgrounds, shapes, text)
    if ("fills" in node && Array.isArray(node.fills) && node.fills !== figma.mixed) {
      const newFills = node.fills.map(fill => {
        if (fill.type !== "SOLID") return fill;
        const matched = findVariable(fill.color, fill.opacity !== undefined ? fill.opacity : 1);
        if (!matched) return fill;
        boundCount++;
        return figma.variables.setBoundVariableForPaint(fill, "color", matched);
      });
      try { node.fills = newFills; } catch (_) {}
    }

    // Strokes (borders)
    if ("strokes" in node && Array.isArray(node.strokes) && node.strokes !== figma.mixed) {
      const newStrokes = node.strokes.map(stroke => {
        if (stroke.type !== "SOLID") return stroke;
        const matched = findVariable(stroke.color, stroke.opacity !== undefined ? stroke.opacity : 1);
        if (!matched) return stroke;
        boundCount++;
        return figma.variables.setBoundVariableForPaint(stroke, "color", matched);
      });
      try { node.strokes = newStrokes; } catch (_) {}
    }

    if ("children" in node) {
      for (const child of node.children) traverse(child);
    }
  }

  const targets = figma.currentPage.selection.length > 0
    ? figma.currentPage.selection
    : figma.currentPage.children;

  for (const node of targets) traverse(node);

  figma.notify(`✅  Bound ${boundCount} fills/strokes across ${visitedCount} nodes.`);
  figma.closePlugin();
}

// ─── Command: Create Text Styles ─────────────────────────────────────────────

// Tailwind text sizes with their default line heights
const TEXT_SIZES = [
  { name: "xs",   size: 12,  lineHeight: 16  },
  { name: "sm",   size: 14,  lineHeight: 20  },
  { name: "base", size: 16,  lineHeight: 24  },
  { name: "lg",   size: 18,  lineHeight: 28  },
  { name: "xl",   size: 20,  lineHeight: 28  },
  { name: "2xl",  size: 24,  lineHeight: 32  },
  { name: "3xl",  size: 30,  lineHeight: 36  },
  { name: "4xl",  size: 36,  lineHeight: 40  },
  { name: "5xl",  size: 48,  lineHeight: 48  },
  { name: "6xl",  size: 60,  lineHeight: 60  },
  { name: "7xl",  size: 72,  lineHeight: 72  },
  { name: "8xl",  size: 96,  lineHeight: 96  },
  { name: "9xl",  size: 128, lineHeight: 128 },
];

// Weights available in standard Inter (Figma built-in)
// Book (470) and Text (570) are variable-font only — mapped to nearest named style
// but labelled correctly so designers know what they map to in code
const TEXT_WEIGHTS = [
  { label: "Thin",        style: "Thin"       },
  { label: "ExtraLight",  style: "Extra Light" },
  { label: "Light",       style: "Light"      },
  { label: "Regular",     style: "Regular"    },
  { label: "Book",        style: "Regular"    }, // Inter variable font wght:470 → nearest named
  { label: "Medium",      style: "Medium"     },
  { label: "Text",        style: "Medium"     }, // Inter variable font wght:570 → nearest named
  { label: "SemiBold",    style: "Semi Bold"  },
  { label: "Bold",        style: "Bold"       },
  { label: "ExtraBold",   style: "Extra Bold" },
  { label: "Black",       style: "Black"      },
];

async function createTextStyles() {
  // Load all unique font styles first
  const uniqueStyles = [...new Set(TEXT_WEIGHTS.map(w => w.style))];
  await Promise.all(
    uniqueStyles.map(style =>
      figma.loadFontAsync({ family: "Inter", style }).catch(() => {
        console.warn(`Could not load Inter ${style}`);
      })
    )
  );

  // Remove any existing Cadie text styles (idempotent re-runs)
  for (const s of figma.getLocalTextStyles()) {
    if (s.name.startsWith("Cadie /")) s.remove();
  }

  let created = 0;

  for (const size of TEXT_SIZES) {
    for (const weight of TEXT_WEIGHTS) {
      try {
        const style = figma.createTextStyle();
        style.name        = `Cadie / ${size.name} / ${weight.label}`;
        style.fontName    = { family: "Inter", style: weight.style };
        style.fontSize    = size.size;
        style.lineHeight  = { value: size.lineHeight, unit: "PIXELS" };
        style.letterSpacing = { value: 0, unit: "PIXELS" };
        created++;
      } catch (e) {
        console.warn(`Skipped Cadie / ${size.name} / ${weight.label}:`, e.message);
      }
    }
  }

  figma.notify(`✅  Created ${created} text styles in Inter (13 sizes × 11 weights).`);
  figma.closePlugin();
}

// ─── Command: Create Button Components ───────────────────────────────────────

async function createButtonComponents() {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const colorVars = figma.variables.getLocalVariables("COLOR");

  function getVar(name) {
    return colorVars.find(function(v) { return v.name === name; }) || null;
  }

  function makePaint(varName) {
    const base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    const variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } },
      "color",
      variable
    );
  }

  function applyFill(node, varName) {
    node.fills = varName ? [makePaint(varName)] : [];
  }

  function applyStroke(node, varName) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = 1;
    node.strokeAlign = "INSIDE";
  }

  // ── Variant definitions ───────────────────────────────────────────────────
  // Mirrors button.tsx variants exactly
  var VARIANTS = [
    { name: "Default",               bg: "button/primary",        fg: "fg/on-accent",        stroke: null               },
    { name: "Neutral",               bg: "button/neutral",        fg: "fg/on-accent",        stroke: null               },
    { name: "Secondary",             bg: "button/secondary",      fg: "fg/default",          stroke: null               },
    { name: "Outline",               bg: "bg/surface",            fg: "fg/default",          stroke: "border/default"   },
    { name: "Ghost",                 bg: null,                    fg: "fg/default",          stroke: null               },
    { name: "Destructive",           bg: null,                    fg: "destructive/default", stroke: null               },
    { name: "Destructive Outline",   bg: null,                    fg: "destructive/default", stroke: "border/destructive" },
    { name: "Destructive Secondary", bg: "destructive/muted",     fg: "destructive/default", stroke: null               },
    { name: "Link",                  bg: null,                    fg: "accent/default",      stroke: null               },
  ];

  // ── Size definitions ──────────────────────────────────────────────────────
  // paddingV = (h - fs) / 2 so auto-layout gives exact heights

  // Text button sizes — rounded-md/lg/xl
  var TEXT_SIZES = [
    { name: "XS",      h: 24, paddingH: 8,  fs: 12, radius: 8,  gap: 4 },
    { name: "SM",      h: 28, paddingH: 10, fs: 14, radius: 8,  gap: 6 },
    { name: "Default", h: 32, paddingH: 12, fs: 14, radius: 8,  gap: 8 },
    { name: "LG",      h: 36, paddingH: 14, fs: 16, radius: 10, gap: 8 },
    { name: "XL",      h: 40, paddingH: 16, fs: 16, radius: 14, gap: 8 },
  ];

  // Pill button sizes — rounded-full
  var PILL_SIZES = [
    { name: "XS", h: 24, paddingH: 10, fs: 12, radius: 9999, gap: 4 },
    { name: "SM", h: 28, paddingH: 12, fs: 14, radius: 9999, gap: 6 },
    { name: "MD", h: 32, paddingH: 16, fs: 14, radius: 9999, gap: 8 },
    { name: "LG", h: 36, paddingH: 20, fs: 16, radius: 9999, gap: 8 },
    { name: "XL", h: 40, paddingH: 24, fs: 16, radius: 9999, gap: 8 },
  ];

  // Icon button sizes — square, rounded-md
  var ICON_SIZES = [
    { name: "XS", s: 24, radius: 8,    iconS: 12 },
    { name: "SM", s: 28, radius: 8,    iconS: 14 },
    { name: "MD", s: 32, radius: 8,    iconS: 16 },
    { name: "LG", s: 36, radius: 8,    iconS: 16 },
    { name: "XL", s: 40, radius: 8,    iconS: 18 },
  ];

  // Icon pill sizes — square, rounded-full
  var ICON_PILL_SIZES = [
    { name: "XS", s: 24, radius: 9999, iconS: 12 },
    { name: "SM", s: 28, radius: 9999, iconS: 14 },
    { name: "MD", s: 32, radius: 9999, iconS: 16 },
    { name: "LG", s: 36, radius: 9999, iconS: 16 },
    { name: "XL", s: 40, radius: 9999, iconS: 18 },
  ];

  // ── Component factories ───────────────────────────────────────────────────

  function makeTextButton(variant, size) {
    var paddingV = (size.h - size.fs) / 2;
    var comp = figma.createComponent();
    comp.name = "Variant=" + variant.name + ", Size=" + size.name;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "AUTO";
    comp.paddingLeft   = size.paddingH;
    comp.paddingRight  = size.paddingH;
    comp.paddingTop    = paddingV;
    comp.paddingBottom = paddingV;
    comp.itemSpacing   = size.gap;
    comp.cornerRadius  = size.radius;
    applyFill(comp, variant.bg);
    applyStroke(comp, variant.stroke);

    var text = figma.createText();
    text.fontName = { family: "Inter", style: "Medium" };
    text.fontSize = size.fs;
    text.lineHeight = { unit: "PIXELS", value: size.fs };
    text.characters = "Button";
    text.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(text, variant.fg);

    comp.appendChild(text);
    return comp;
  }

  function makeIconButton(variant, size) {
    var comp = figma.createComponent();
    comp.name = "Variant=" + variant.name + ", Size=" + size.name;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    comp.resize(size.s, size.s);
    comp.cornerRadius = size.radius;
    applyFill(comp, variant.bg);
    applyStroke(comp, variant.stroke);

    // Icon placeholder — rounded rectangle
    var icon = figma.createRectangle();
    icon.resize(size.iconS, size.iconS);
    icon.cornerRadius = 2;
    applyFill(icon, variant.fg);
    comp.appendChild(icon);
    return comp;
  }

  // ── Build a ComponentSet from a group of sizes ────────────────────────────
  // Variants = columns, sizes = rows

  function buildSet(label, sizes, factory, xOrigin, yOrigin) {
    var colStep  = label === "Icon" || label === "Icon Pill" ? 56 : 112;
    var rowStep  = 56;
    var padding  = 24;
    var components = [];

    for (var c = 0; c < VARIANTS.length; c++) {
      for (var r = 0; r < sizes.length; r++) {
        var comp = factory(VARIANTS[c], sizes[r]);
        comp.x = xOrigin + padding + c * colStep;
        comp.y = yOrigin + padding + r * rowStep;
        components.push(comp);
      }
    }

    var set = figma.combineAsVariants(components, figma.currentPage);
    set.name = "Cadie / Button / " + label;
    set.layoutMode = "NONE";
    set.paddingLeft   = padding;
    set.paddingRight  = padding;
    set.paddingTop    = padding;
    set.paddingBottom = padding;
    set.x = xOrigin;
    set.y = yOrigin;
    // Give the set a subtle border
    set.strokeWeight = 1;
    set.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
    set.cornerRadius = 12;
    return set;
  }

  // ── Remove existing button component sets ─────────────────────────────────
  var existing = figma.currentPage.findAll(function(n) {
    return n.type === "COMPONENT_SET" && n.name.indexOf("Cadie / Button /") === 0;
  });
  for (var i = 0; i < existing.length; i++) { existing[i].remove(); }

  // ── Create all four sets stacked vertically ───────────────────────────────
  var setHeight = 24 + ICON_SIZES.length * 56 + 24;  // consistent row count
  var gap       = 80;
  var y         = 0;

  var textSet     = buildSet("Text",      TEXT_SIZES,      makeTextButton, 0, y); y += textSet.height + gap;
  var pillSet     = buildSet("Pill",      PILL_SIZES,      makeTextButton, 0, y); y += pillSet.height + gap;
  var iconSet     = buildSet("Icon",      ICON_SIZES,      makeIconButton, 0, y); y += iconSet.height + gap;
  buildSet("Icon Pill", ICON_PILL_SIZES, makeIconButton, 0, y);

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView(
    figma.currentPage.findAll(function(n) {
      return n.type === "COMPONENT_SET" && n.name.indexOf("Cadie / Button /") === 0;
    })
  );

  var total = VARIANTS.length * (TEXT_SIZES.length + PILL_SIZES.length + ICON_SIZES.length + ICON_PILL_SIZES.length);
  figma.notify("✅  Created " + total + " button components across 4 component sets.");
  figma.closePlugin();
}

// ─── Command: Create Tier 1 Components ───────────────────────────────────────

async function createTier1Components() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  var colorVars = figma.variables.getLocalVariables("COLOR");

  function getVar(name) {
    return colorVars.find(function(v) { return v.name === name; }) || null;
  }

  function makePaint(varName) {
    var base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    var variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }, "color", variable
    );
  }

  function applyFill(node, varName) {
    node.fills = varName ? [makePaint(varName)] : [];
  }

  function applyStroke(node, varName, weight) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = weight || 1;
    node.strokeAlign = "INSIDE";
  }

  // Idempotent: remove any existing tier 1 sets
  var tier1Prefixes = [
    "Cadie / Badge", "Cadie / Avatar", "Cadie / Input",
    "Cadie / Checkbox", "Cadie / Switch", "Cadie / Spinner",
    "Cadie / Kbd", "Cadie / Separator", "Cadie / Textarea", "Cadie / Label"
  ];
  var existing = figma.currentPage.findAll(function(n) {
    if (n.type !== "COMPONENT_SET") return false;
    for (var i = 0; i < tier1Prefixes.length; i++) {
      if (n.name.indexOf(tier1Prefixes[i]) === 0) return true;
    }
    return false;
  });
  for (var ri = 0; ri < existing.length; ri++) { existing[ri].remove(); }

  // Start Y below any existing button sets
  var buttonSets = figma.currentPage.findAll(function(n) {
    return n.type === "COMPONENT_SET" && n.name.indexOf("Cadie / Button /") === 0;
  });
  var startY = 0;
  for (var bi = 0; bi < buttonSets.length; bi++) {
    var bottom = buttonSets[bi].y + buttonSets[bi].height;
    if (bottom > startY) startY = bottom;
  }
  startY += 120;

  var currentY = startY;
  var GAP = 80;
  var PAD = 24;

  // Wrap components into a named ComponentSet
  function finishSet(components, label, x, y) {
    var set = figma.combineAsVariants(components, figma.currentPage);
    set.name = label;
    set.layoutMode = "NONE";
    set.paddingLeft = PAD;
    set.paddingRight = PAD;
    set.paddingTop = PAD;
    set.paddingBottom = PAD;
    set.strokeWeight = 1;
    set.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
    set.cornerRadius = 12;
    set.x = x;
    set.y = y;
    return set;
  }

  // ── Badge ─────────────────────────────────────────────────────────────────

  var BADGE_VARIANTS = [
    { name: "Default",     bg: "accent/muted",      fg: "accent/default",      stroke: null             },
    { name: "Secondary",   bg: "bg/emphasis",       fg: "fg/default",          stroke: null             },
    { name: "Outline",     bg: null,                fg: "fg/default",          stroke: "border/default" },
    { name: "Success",     bg: "success/muted",     fg: "success/default",     stroke: null             },
    { name: "Warning",     bg: "warning/muted",     fg: "warning/default",     stroke: null             },
    { name: "Destructive", bg: "destructive/muted", fg: "destructive/default", stroke: null             },
    { name: "Error",       bg: "destructive/muted", fg: "destructive/default", stroke: null             },
    { name: "Info",        bg: "accent/muted",      fg: "accent/default",      stroke: null             },
  ];

  var BADGE_SIZES = [
    { name: "SM",      h: 18, px: 6,  fs: 11, radius: 4 },
    { name: "Default", h: 20, px: 8,  fs: 12, radius: 4 },
    { name: "LG",      h: 24, px: 10, fs: 13, radius: 6 },
  ];

  var badgeComps = [];
  for (var bv = 0; bv < BADGE_VARIANTS.length; bv++) {
    for (var bs = 0; bs < BADGE_SIZES.length; bs++) {
      var bvar = BADGE_VARIANTS[bv];
      var bsz  = BADGE_SIZES[bs];
      var bPadV = Math.round((bsz.h - bsz.fs) / 2);

      var bc = figma.createComponent();
      bc.name = "Variant=" + bvar.name + ", Size=" + bsz.name;
      bc.layoutMode = "HORIZONTAL";
      bc.primaryAxisAlignItems = "CENTER";
      bc.counterAxisAlignItems = "CENTER";
      bc.primaryAxisSizingMode = "AUTO";
      bc.counterAxisSizingMode = "AUTO";
      bc.paddingLeft = bsz.px;
      bc.paddingRight = bsz.px;
      bc.paddingTop = bPadV;
      bc.paddingBottom = bPadV;
      bc.cornerRadius = bsz.radius;
      applyFill(bc, bvar.bg);
      applyStroke(bc, bvar.stroke, 1);

      var bt = figma.createText();
      bt.fontName = { family: "Inter", style: "Medium" };
      bt.fontSize = bsz.fs;
      bt.lineHeight = { unit: "PIXELS", value: bsz.fs };
      bt.characters = bvar.name;
      bt.textAutoResize = "WIDTH_AND_HEIGHT";
      applyFill(bt, bvar.fg);
      bc.appendChild(bt);

      bc.x = PAD + bv * 128;
      bc.y = PAD + bs * 40;
      badgeComps.push(bc);
    }
  }
  var badgeSet = finishSet(badgeComps, "Cadie / Badge", 0, currentY);
  currentY += badgeSet.height + GAP;

  // ── Avatar ────────────────────────────────────────────────────────────────

  var AVATAR_SIZES = [
    { name: "SM",      s: 24, fs: 10 },
    { name: "Default", s: 32, fs: 13 },
    { name: "LG",      s: 40, fs: 16 },
    { name: "XL",      s: 48, fs: 19 },
  ];

  var avatarComps = [];
  for (var av = 0; av < AVATAR_SIZES.length; av++) {
    var asz = AVATAR_SIZES[av];
    var ac = figma.createComponent();
    ac.name = "Size=" + asz.name;
    ac.layoutMode = "HORIZONTAL";
    ac.primaryAxisAlignItems = "CENTER";
    ac.counterAxisAlignItems = "CENTER";
    ac.primaryAxisSizingMode = "FIXED";
    ac.counterAxisSizingMode = "FIXED";
    ac.resize(asz.s, asz.s);
    ac.cornerRadius = asz.s / 2;
    applyFill(ac, "bg/muted");

    var at = figma.createText();
    at.fontName = { family: "Inter", style: "Medium" };
    at.fontSize = asz.fs;
    at.lineHeight = { unit: "PIXELS", value: asz.fs };
    at.characters = "AB";
    at.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(at, "fg/muted");
    ac.appendChild(at);

    ac.x = PAD + av * 72;
    ac.y = PAD;
    avatarComps.push(ac);
  }
  var avatarSet = finishSet(avatarComps, "Cadie / Avatar", 0, currentY);
  currentY += avatarSet.height + GAP;

  // ── Input ─────────────────────────────────────────────────────────────────

  var INPUT_STATES = [
    { name: "Default",  bg: "bg/input", border: "border/default", fg: "fg/subtle"   },
    { name: "Focused",  bg: "bg/input", border: "accent/default", fg: "fg/default"  },
    { name: "Disabled", bg: "bg/muted", border: "border/muted",   fg: "fg/disabled" },
  ];

  var INPUT_SIZES = [
    { name: "SM",      h: 28, px: 8,  fs: 13, radius: 6  },
    { name: "Default", h: 32, px: 10, fs: 14, radius: 8  },
    { name: "LG",      h: 36, px: 12, fs: 16, radius: 10 },
  ];

  var inputComps = [];
  for (var ist = 0; ist < INPUT_STATES.length; ist++) {
    for (var isz = 0; isz < INPUT_SIZES.length; isz++) {
      var istate = INPUT_STATES[ist];
      var iszObj = INPUT_SIZES[isz];

      var ic = figma.createComponent();
      ic.name = "State=" + istate.name + ", Size=" + iszObj.name;
      ic.layoutMode = "HORIZONTAL";
      ic.primaryAxisAlignItems = "CENTER";
      ic.counterAxisAlignItems = "CENTER";
      ic.primaryAxisSizingMode = "FIXED";
      ic.counterAxisSizingMode = "FIXED";
      ic.resize(200, iszObj.h);
      ic.paddingLeft = iszObj.px;
      ic.paddingRight = iszObj.px;
      ic.cornerRadius = iszObj.radius;
      applyFill(ic, istate.bg);
      applyStroke(ic, istate.border, 1);

      var it = figma.createText();
      it.fontName = { family: "Inter", style: "Regular" };
      it.fontSize = iszObj.fs;
      it.lineHeight = { unit: "PIXELS", value: iszObj.fs };
      it.characters = istate.name === "Default" ? "Placeholder" : "Value";
      it.textAutoResize = "WIDTH_AND_HEIGHT";
      applyFill(it, istate.fg);
      ic.appendChild(it);

      ic.x = PAD + ist * 224;
      ic.y = PAD + isz * 52;
      inputComps.push(ic);
    }
  }
  var inputSet = finishSet(inputComps, "Cadie / Input", 0, currentY);
  currentY += inputSet.height + GAP;

  // ── Checkbox ──────────────────────────────────────────────────────────────

  var CHECKBOX_STATES = [
    { name: "Unchecked",     bg: null,             border: "border/default", mark: null           },
    { name: "Checked",       bg: "button/primary", border: "button/primary", mark: "fg/on-accent" },
    { name: "Indeterminate", bg: "button/primary", border: "button/primary", mark: "fg/on-accent" },
    { name: "Disabled",      bg: "bg/muted",       border: "border/muted",   mark: null           },
  ];

  var checkboxComps = [];
  for (var cs = 0; cs < CHECKBOX_STATES.length; cs++) {
    var cstate = CHECKBOX_STATES[cs];

    var cc = figma.createComponent();
    cc.name = "State=" + cstate.name;
    cc.layoutMode = "HORIZONTAL";
    cc.primaryAxisAlignItems = "CENTER";
    cc.counterAxisAlignItems = "CENTER";
    cc.primaryAxisSizingMode = "FIXED";
    cc.counterAxisSizingMode = "FIXED";
    cc.resize(16, 16);
    cc.cornerRadius = 4;
    applyFill(cc, cstate.bg);
    applyStroke(cc, cstate.border, 1.5);

    if (cstate.mark) {
      var cm = figma.createRectangle();
      cm.resize(cstate.name === "Indeterminate" ? 8 : 10, 2);
      cm.cornerRadius = 1;
      applyFill(cm, cstate.mark);
      cc.appendChild(cm);
    }

    cc.x = PAD + cs * 56;
    cc.y = PAD;
    checkboxComps.push(cc);
  }
  var checkboxSet = finishSet(checkboxComps, "Cadie / Checkbox", 0, currentY);
  currentY += checkboxSet.height + GAP;

  // ── Switch ────────────────────────────────────────────────────────────────

  var SWITCH_STATES = [
    { name: "Off",      bg: "border/default", thumbFg: "bg/surface"  },
    { name: "On",       bg: "accent/default", thumbFg: "bg/surface"  },
    { name: "Disabled", bg: "bg/muted",       thumbFg: "fg/disabled" },
  ];

  var switchComps = [];
  var swW = 30;
  var swH = 18;
  var thumbS = 12;

  for (var ss = 0; ss < SWITCH_STATES.length; ss++) {
    var sstate = SWITCH_STATES[ss];

    var sc = figma.createComponent();
    sc.name = "State=" + sstate.name;
    sc.layoutMode = "NONE";
    sc.resize(swW, swH);
    sc.cornerRadius = swH / 2;
    applyFill(sc, sstate.bg);
    sc.strokes = [];

    var thumb = figma.createEllipse();
    thumb.resize(thumbS, thumbS);
    thumb.x = sstate.name === "On" ? swW - thumbS - 3 : 3;
    thumb.y = (swH - thumbS) / 2;
    applyFill(thumb, sstate.thumbFg);
    sc.appendChild(thumb);

    sc.x = PAD + ss * 72;
    sc.y = PAD;
    switchComps.push(sc);
  }
  var switchSet = finishSet(switchComps, "Cadie / Switch", 0, currentY);
  currentY += switchSet.height + GAP;

  // ── Spinner ───────────────────────────────────────────────────────────────

  var SPINNER_SIZES = [
    { name: "SM",      s: 12 },
    { name: "Default", s: 16 },
    { name: "LG",      s: 20 },
    { name: "XL",      s: 24 },
  ];

  var spinnerComps = [];
  for (var sp = 0; sp < SPINNER_SIZES.length; sp++) {
    var spSz = SPINNER_SIZES[sp];

    var spc = figma.createComponent();
    spc.name = "Size=" + spSz.name;
    spc.layoutMode = "NONE";
    spc.resize(spSz.s, spSz.s);
    spc.fills = [];

    var track = figma.createEllipse();
    track.resize(spSz.s, spSz.s);
    track.fills = [];
    track.strokes = [makePaint("border/default")];
    track.strokeWeight = 2;
    track.strokeAlign = "CENTER";
    spc.appendChild(track);

    var arc = figma.createEllipse();
    arc.resize(spSz.s, spSz.s);
    arc.fills = [];
    arc.arcData = { startingAngle: 0, endingAngle: 4.712, innerRadius: 0 };
    arc.strokes = [makePaint("accent/default")];
    arc.strokeWeight = 2;
    arc.strokeAlign = "CENTER";
    spc.appendChild(arc);

    spc.x = PAD + sp * 56;
    spc.y = PAD;
    spinnerComps.push(spc);
  }
  var spinnerSet = finishSet(spinnerComps, "Cadie / Spinner", 0, currentY);
  currentY += spinnerSet.height + GAP;

  // ── Kbd ───────────────────────────────────────────────────────────────────

  var KBD_KEYS = [
    { name: "Key=K",      text: "K"   },
    { name: "Key=Cmd",    text: "Cmd" },
    { name: "Key=Enter",  text: "↵"   },
    { name: "Key=Escape", text: "Esc" },
  ];

  var kbdComps = [];
  for (var kv = 0; kv < KBD_KEYS.length; kv++) {
    var kk = KBD_KEYS[kv];

    var kc = figma.createComponent();
    kc.name = kk.name;
    kc.layoutMode = "HORIZONTAL";
    kc.primaryAxisAlignItems = "CENTER";
    kc.counterAxisAlignItems = "CENTER";
    kc.primaryAxisSizingMode = "AUTO";
    kc.counterAxisSizingMode = "AUTO";
    kc.paddingLeft = 6;
    kc.paddingRight = 6;
    kc.paddingTop = 2;
    kc.paddingBottom = 2;
    kc.cornerRadius = 4;
    applyFill(kc, "bg/muted");
    applyStroke(kc, "border/default", 1);

    var kt = figma.createText();
    kt.fontName = { family: "Inter", style: "Regular" };
    kt.fontSize = 12;
    kt.lineHeight = { unit: "PIXELS", value: 16 };
    kt.characters = kk.text;
    kt.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(kt, "fg/muted");
    kc.appendChild(kt);

    kc.x = PAD + kv * 80;
    kc.y = PAD;
    kbdComps.push(kc);
  }
  var kbdSet = finishSet(kbdComps, "Cadie / Kbd", 0, currentY);
  currentY += kbdSet.height + GAP;

  // ── Separator ─────────────────────────────────────────────────────────────

  var sepComps = [];

  var hSep = figma.createComponent();
  hSep.name = "Orientation=Horizontal";
  hSep.resize(200, 1);
  applyFill(hSep, "border/default");
  hSep.x = PAD;
  hSep.y = PAD + 20;
  sepComps.push(hSep);

  var vSep = figma.createComponent();
  vSep.name = "Orientation=Vertical";
  vSep.resize(1, 40);
  applyFill(vSep, "border/default");
  vSep.x = PAD + 240;
  vSep.y = PAD;
  sepComps.push(vSep);

  var separatorSet = finishSet(sepComps, "Cadie / Separator", 0, currentY);
  currentY += separatorSet.height + GAP;

  // ── Textarea ──────────────────────────────────────────────────────────────

  var TEXTAREA_STATES = [
    { name: "Default",  bg: "bg/input", border: "border/default", fg: "fg/subtle"   },
    { name: "Focused",  bg: "bg/input", border: "accent/default", fg: "fg/default"  },
    { name: "Disabled", bg: "bg/muted", border: "border/muted",   fg: "fg/disabled" },
  ];

  var TEXTAREA_SIZES = [
    { name: "SM",      w: 200, h: 60,  px: 8,  py: 6,  fs: 13, radius: 6  },
    { name: "Default", w: 200, h: 80,  px: 10, py: 8,  fs: 14, radius: 8  },
    { name: "LG",      w: 200, h: 100, px: 12, py: 10, fs: 16, radius: 10 },
  ];

  var taComps = [];
  for (var tas = 0; tas < TEXTAREA_STATES.length; tas++) {
    for (var tasz = 0; tasz < TEXTAREA_SIZES.length; tasz++) {
      var tastate = TEXTAREA_STATES[tas];
      var taSz = TEXTAREA_SIZES[tasz];

      var tac = figma.createComponent();
      tac.name = "State=" + tastate.name + ", Size=" + taSz.name;
      tac.layoutMode = "VERTICAL";
      tac.primaryAxisAlignItems = "MIN";
      tac.counterAxisAlignItems = "MIN";
      tac.primaryAxisSizingMode = "FIXED";
      tac.counterAxisSizingMode = "FIXED";
      tac.resize(taSz.w, taSz.h);
      tac.paddingLeft = taSz.px;
      tac.paddingRight = taSz.px;
      tac.paddingTop = taSz.py;
      tac.paddingBottom = taSz.py;
      tac.cornerRadius = taSz.radius;
      applyFill(tac, tastate.bg);
      applyStroke(tac, tastate.border, 1);

      var tat = figma.createText();
      tat.fontName = { family: "Inter", style: "Regular" };
      tat.fontSize = taSz.fs;
      tat.lineHeight = { unit: "PIXELS", value: Math.round(taSz.fs * 1.5) };
      tat.characters = tastate.name === "Default" ? "Placeholder..." : "Text value";
      tat.textAutoResize = "WIDTH_AND_HEIGHT";
      applyFill(tat, tastate.fg);
      tac.appendChild(tat);

      tac.x = PAD + tas * 224;
      tac.y = PAD + tasz * 120;
      taComps.push(tac);
    }
  }
  var textareaSet = finishSet(taComps, "Cadie / Textarea", 0, currentY);
  currentY += textareaSet.height + GAP;

  // ── Label ─────────────────────────────────────────────────────────────────

  var LABEL_VARIANTS = [
    { name: "Default",  fg: "fg/default",  text: "Label"            },
    { name: "Disabled", fg: "fg/disabled", text: "Label"            },
    { name: "Required", fg: "fg/default",  text: "Label *"          },
    { name: "Optional", fg: "fg/muted",    text: "Label (optional)" },
  ];

  var labelComps = [];
  for (var lv = 0; lv < LABEL_VARIANTS.length; lv++) {
    var lvar = LABEL_VARIANTS[lv];

    var lc = figma.createComponent();
    lc.name = "Variant=" + lvar.name;
    lc.layoutMode = "HORIZONTAL";
    lc.primaryAxisAlignItems = "CENTER";
    lc.counterAxisAlignItems = "CENTER";
    lc.primaryAxisSizingMode = "AUTO";
    lc.counterAxisSizingMode = "AUTO";
    lc.fills = [];

    var lt = figma.createText();
    lt.fontName = { family: "Inter", style: "Regular" };
    lt.fontSize = 14;
    lt.lineHeight = { unit: "PIXELS", value: 16 };
    lt.characters = lvar.text;
    lt.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(lt, lvar.fg);
    lc.appendChild(lt);

    lc.x = PAD + lv * 140;
    lc.y = PAD;
    labelComps.push(lc);
  }
  var labelSet = finishSet(labelComps, "Cadie / Label", 0, currentY);

  // Zoom to fit all new tier 1 sets
  var allTier1 = figma.currentPage.findAll(function(n) {
    if (n.type !== "COMPONENT_SET") return false;
    for (var i = 0; i < tier1Prefixes.length; i++) {
      if (n.name.indexOf(tier1Prefixes[i]) === 0) return true;
    }
    return false;
  });
  figma.viewport.scrollAndZoomIntoView(allTier1);

  figma.notify("✅  Created Tier 1 components: Badge, Avatar, Input, Checkbox, Switch, Spinner, Kbd, Separator, Textarea, Label.");
  figma.closePlugin();
}

// ─── Command: Create Tier 2 Components ───────────────────────────────────────

async function createTier2Components() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(function() {});
  await figma.loadFontAsync({ family: "Inter", style: "Semibold" }).catch(function() {});

  var colorVars = figma.variables.getLocalVariables("COLOR");

  function getVar(name) {
    return colorVars.find(function(v) { return v.name === name; }) || null;
  }

  function makePaint(varName) {
    var base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    var variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }, "color", variable
    );
  }

  function applyFill(node, varName) {
    node.fills = varName ? [makePaint(varName)] : [];
  }

  function applyStroke(node, varName, weight) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = weight || 1;
    node.strokeAlign = "INSIDE";
  }

  var tier2Prefixes = [
    "Cadie / App / Sidebar Item",
    "Cadie / App / Space Chip",
    "Cadie / App / Link Row",
    "Cadie / App / Capture Input",
    "Cadie / App / Dock Item"
  ];

  var existing = figma.currentPage.findAll(function(n) {
    if (n.type !== "COMPONENT_SET") return false;
    for (var i = 0; i < tier2Prefixes.length; i++) {
      if (n.name.indexOf(tier2Prefixes[i]) === 0) return true;
    }
    return false;
  });
  for (var e = 0; e < existing.length; e++) { existing[e].remove(); }

  var allSets = figma.currentPage.findAll(function(n) { return n.type === "COMPONENT_SET"; });
  var startY = 0;
  for (var si = 0; si < allSets.length; si++) {
    var bottom = allSets[si].y + allSets[si].height;
    if (bottom > startY) startY = bottom;
  }
  startY += 120;

  var currentY = startY;
  var GAP = 80;
  var PAD = 24;

  function finishSet(components, label, x, y) {
    var set = figma.combineAsVariants(components, figma.currentPage);
    set.name = label;
    set.layoutMode = "NONE";
    set.paddingLeft = PAD;
    set.paddingRight = PAD;
    set.paddingTop = PAD;
    set.paddingBottom = PAD;
    set.strokeWeight = 1;
    set.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
    set.cornerRadius = 12;
    set.x = x;
    set.y = y;
    return set;
  }

  // ── Sidebar Item ───────────────────────────────────────────────────────────

  var SIDEBAR_STATES = [
    { name: "Default",  bg: null,          fg: "fg/muted",   dot: "bg/emphasis"  },
    { name: "Hover",    bg: "bg/hover",    fg: "fg/default", dot: "accent/default" },
    { name: "Active",   bg: "bg/selected", fg: "fg/default", dot: "accent/default" },
    { name: "Disabled", bg: null,          fg: "fg/disabled", dot: "border/muted"  }
  ];

  var sidebarComps = [];
  for (var ss = 0; ss < SIDEBAR_STATES.length; ss++) {
    var sState = SIDEBAR_STATES[ss];

    var sc = figma.createComponent();
    sc.name = "State=" + sState.name;
    sc.layoutMode = "HORIZONTAL";
    sc.primaryAxisAlignItems = "CENTER";
    sc.counterAxisAlignItems = "CENTER";
    sc.primaryAxisSizingMode = "FIXED";
    sc.counterAxisSizingMode = "FIXED";
    sc.itemSpacing = 10;
    sc.paddingLeft = 10;
    sc.paddingRight = 10;
    sc.resize(220, 36);
    sc.cornerRadius = 8;
    applyFill(sc, sState.bg);
    sc.strokes = [];

    var dot = figma.createEllipse();
    dot.resize(8, 8);
    applyFill(dot, sState.dot);
    sc.appendChild(dot);

    var st = figma.createText();
    st.fontName = { family: "Inter", style: "Medium" };
    st.fontSize = 14;
    st.lineHeight = { unit: "PIXELS", value: 20 };
    st.characters = "All links";
    st.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(st, sState.fg);
    sc.appendChild(st);

    sc.x = PAD;
    sc.y = PAD + ss * 48;
    sidebarComps.push(sc);
  }
  var sidebarSet = finishSet(sidebarComps, "Cadie / App / Sidebar Item", 0, currentY);
  currentY += sidebarSet.height + GAP;

  // ── Space Chip ─────────────────────────────────────────────────────────────

  var CHIP_VARIANTS = [
    { name: "Default",     dot: "fg/muted",       bg: "bg/field-light" },
    { name: "Accent",      dot: "accent/default", bg: "accent/muted"    },
    { name: "Success",     dot: "success/default", bg: "success/muted"  },
    { name: "Warning",     dot: "warning/default", bg: "warning/muted"  }
  ];
  var CHIP_SELECTED = [
    { name: "False", border: "border/default" },
    { name: "True",  border: "accent/default" }
  ];

  var chipComps = [];
  for (var cv = 0; cv < CHIP_VARIANTS.length; cv++) {
    for (var cs2 = 0; cs2 < CHIP_SELECTED.length; cs2++) {
      var chipV = CHIP_VARIANTS[cv];
      var chipS = CHIP_SELECTED[cs2];

      var cc = figma.createComponent();
      cc.name = "Variant=" + chipV.name + ", Selected=" + chipS.name;
      cc.layoutMode = "HORIZONTAL";
      cc.primaryAxisAlignItems = "CENTER";
      cc.counterAxisAlignItems = "CENTER";
      cc.primaryAxisSizingMode = "AUTO";
      cc.counterAxisSizingMode = "AUTO";
      cc.itemSpacing = 8;
      cc.paddingLeft = 10;
      cc.paddingRight = 10;
      cc.paddingTop = 6;
      cc.paddingBottom = 6;
      cc.cornerRadius = 999;
      applyFill(cc, chipV.bg);
      applyStroke(cc, chipS.border, chipS.name === "True" ? 1.5 : 1);

      var cdot = figma.createEllipse();
      cdot.resize(8, 8);
      applyFill(cdot, chipV.dot);
      cc.appendChild(cdot);

      var ct = figma.createText();
      ct.fontName = { family: "Inter", style: "Medium" };
      ct.fontSize = 12;
      ct.lineHeight = { unit: "PIXELS", value: 16 };
      ct.characters = "Product";
      ct.textAutoResize = "WIDTH_AND_HEIGHT";
      applyFill(ct, "fg/default");
      cc.appendChild(ct);

      cc.x = PAD + cv * 172;
      cc.y = PAD + cs2 * 56;
      chipComps.push(cc);
    }
  }
  var chipSet = finishSet(chipComps, "Cadie / App / Space Chip", 0, currentY);
  currentY += chipSet.height + GAP;

  // ── Link Row ───────────────────────────────────────────────────────────────

  var ROW_STATES = [
    { name: "Default",  bg: null,          title: "fg/default", meta: "fg/muted", border: "border/muted" },
    { name: "Hover",    bg: "bg/hover",    title: "fg/default", meta: "fg/muted", border: "border/muted" },
    { name: "Selected", bg: "bg/selected", title: "fg/default", meta: "fg/default", border: "accent/default" }
  ];

  var rowComps = [];
  for (var rs = 0; rs < ROW_STATES.length; rs++) {
    var rowS = ROW_STATES[rs];

    var rc = figma.createComponent();
    rc.name = "State=" + rowS.name;
    rc.layoutMode = "HORIZONTAL";
    rc.primaryAxisAlignItems = "CENTER";
    rc.counterAxisAlignItems = "CENTER";
    rc.primaryAxisSizingMode = "FIXED";
    rc.counterAxisSizingMode = "FIXED";
    rc.itemSpacing = 10;
    rc.paddingLeft = 10;
    rc.paddingRight = 10;
    rc.resize(760, 56);
    rc.cornerRadius = 10;
    applyFill(rc, rowS.bg);
    applyStroke(rc, rowS.border, rowS.name === "Selected" ? 1.5 : 1);

    var thumb = figma.createRectangle();
    thumb.resize(40, 40);
    thumb.cornerRadius = 8;
    applyFill(thumb, "bg/muted");
    rc.appendChild(thumb);

    var textCol = figma.createFrame();
    textCol.layoutMode = "VERTICAL";
    textCol.primaryAxisSizingMode = "AUTO";
    textCol.counterAxisSizingMode = "AUTO";
    textCol.itemSpacing = 3;
    textCol.fills = [];
    textCol.strokes = [];
    rc.appendChild(textCol);

    var title = figma.createText();
    title.fontName = { family: "Inter", style: "Medium" };
    title.fontSize = 14;
    title.lineHeight = { unit: "PIXELS", value: 20 };
    title.characters = "How to design robust APIs";
    title.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(title, rowS.title);
    textCol.appendChild(title);

    var meta = figma.createText();
    meta.fontName = { family: "Inter", style: "Regular" };
    meta.fontSize = 12;
    meta.lineHeight = { unit: "PIXELS", value: 16 };
    meta.characters = "blog.example.com • 5 min ago";
    meta.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(meta, rowS.meta);
    textCol.appendChild(meta);

    var badge = figma.createFrame();
    badge.layoutMode = "HORIZONTAL";
    badge.primaryAxisAlignItems = "CENTER";
    badge.counterAxisAlignItems = "CENTER";
    badge.primaryAxisSizingMode = "AUTO";
    badge.counterAxisSizingMode = "AUTO";
    badge.paddingLeft = 6;
    badge.paddingRight = 6;
    badge.paddingTop = 2;
    badge.paddingBottom = 2;
    badge.cornerRadius = 4;
    applyFill(badge, "accent/muted");
    badge.strokes = [];
    badge.x = 670;
    badge.y = 18;

    var badgeText = figma.createText();
    badgeText.fontName = { family: "Inter", style: "Medium" };
    badgeText.fontSize = 11;
    badgeText.lineHeight = { unit: "PIXELS", value: 14 };
    badgeText.characters = "Product";
    badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(badgeText, "accent/default");
    badge.appendChild(badgeText);
    rc.appendChild(badge);

    rc.x = PAD;
    rc.y = PAD + rs * 72;
    rowComps.push(rc);
  }
  var rowSet = finishSet(rowComps, "Cadie / App / Link Row", 0, currentY);
  currentY += rowSet.height + GAP;

  // ── Capture Input ──────────────────────────────────────────────────────────

  var CAPTURE_STATES = [
    { name: "Idle",    border: "border/default", ring: null             },
    { name: "Focused", border: "accent/default", ring: "ring/default"   },
    { name: "Error",   border: "destructive/default", ring: "destructive/default" }
  ];

  var captureComps = [];
  for (var cp = 0; cp < CAPTURE_STATES.length; cp++) {
    var cState = CAPTURE_STATES[cp];

    var ci = figma.createComponent();
    ci.name = "State=" + cState.name;
    ci.layoutMode = "HORIZONTAL";
    ci.primaryAxisAlignItems = "CENTER";
    ci.counterAxisAlignItems = "CENTER";
    ci.primaryAxisSizingMode = "FIXED";
    ci.counterAxisSizingMode = "FIXED";
    ci.itemSpacing = 10;
    ci.paddingLeft = 12;
    ci.paddingRight = 8;
    ci.resize(620, 44);
    ci.cornerRadius = 12;
    applyFill(ci, "bg/input");
    applyStroke(ci, cState.border, 1);
    if (cState.ring) {
      ci.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0.376, g: 0.506, b: 0.92, a: 0.25 },
        offset: { x: 0, y: 0 },
        radius: 0,
        blendMode: "NORMAL",
        visible: true
      }];
    } else {
      ci.effects = [];
    }

    var ico = figma.createEllipse();
    ico.resize(16, 16);
    applyFill(ico, "fg/subtle");
    ci.appendChild(ico);

    var hint = figma.createText();
    hint.fontName = { family: "Inter", style: "Regular" };
    hint.fontSize = 14;
    hint.lineHeight = { unit: "PIXELS", value: 20 };
    hint.characters = cState.name === "Error" ? "Invalid URL" : "Paste a link, article, or note...";
    hint.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(hint, cState.name === "Error" ? "destructive/default" : "fg/subtle");
    ci.appendChild(hint);

    var quick = figma.createFrame();
    quick.layoutMode = "HORIZONTAL";
    quick.primaryAxisAlignItems = "CENTER";
    quick.counterAxisAlignItems = "CENTER";
    quick.primaryAxisSizingMode = "AUTO";
    quick.counterAxisSizingMode = "AUTO";
    quick.paddingLeft = 6;
    quick.paddingRight = 6;
    quick.paddingTop = 2;
    quick.paddingBottom = 2;
    quick.cornerRadius = 4;
    applyFill(quick, "bg/muted");
    quick.strokes = [];

    var qtxt = figma.createText();
    qtxt.fontName = { family: "Inter", style: "Medium" };
    qtxt.fontSize = 11;
    qtxt.lineHeight = { unit: "PIXELS", value: 14 };
    qtxt.characters = "⌘K";
    qtxt.textAutoResize = "WIDTH_AND_HEIGHT";
    applyFill(qtxt, "fg/muted");
    quick.appendChild(qtxt);
    ci.appendChild(quick);

    ci.x = PAD;
    ci.y = PAD + cp * 60;
    captureComps.push(ci);
  }
  var captureSet = finishSet(captureComps, "Cadie / App / Capture Input", 0, currentY);
  currentY += captureSet.height + GAP;

  // ── Dock Item ──────────────────────────────────────────────────────────────

  var DOCK_STATES = [
    { name: "Default", bg: "bg/surface", border: "border/default", dot: null             },
    { name: "Hover",   bg: "bg/hover",   border: "border/hover",   dot: null             },
    { name: "Active",  bg: "bg/selected", border: "accent/default", dot: "accent/default" }
  ];

  var dockComps = [];
  for (var ds = 0; ds < DOCK_STATES.length; ds++) {
    var dState = DOCK_STATES[ds];
    var dc = figma.createComponent();
    dc.name = "State=" + dState.name;
    dc.layoutMode = "VERTICAL";
    dc.primaryAxisAlignItems = "CENTER";
    dc.counterAxisAlignItems = "CENTER";
    dc.primaryAxisSizingMode = "FIXED";
    dc.counterAxisSizingMode = "FIXED";
    dc.itemSpacing = 6;
    dc.resize(52, 60);
    dc.cornerRadius = 12;
    applyFill(dc, dState.bg);
    applyStroke(dc, dState.border, 1);

    var icon = figma.createRectangle();
    icon.resize(20, 20);
    icon.cornerRadius = 6;
    applyFill(icon, "fg/muted");
    dc.appendChild(icon);

    if (dState.dot) {
      var activeDot = figma.createEllipse();
      activeDot.resize(5, 5);
      applyFill(activeDot, dState.dot);
      dc.appendChild(activeDot);
    }

    dc.x = PAD + ds * 96;
    dc.y = PAD;
    dockComps.push(dc);
  }
  finishSet(dockComps, "Cadie / App / Dock Item", 0, currentY);

  var allTier2 = figma.currentPage.findAll(function(n) {
    if (n.type !== "COMPONENT_SET") return false;
    for (var i = 0; i < tier2Prefixes.length; i++) {
      if (n.name.indexOf(tier2Prefixes[i]) === 0) return true;
    }
    return false;
  });
  figma.viewport.scrollAndZoomIntoView(allTier2);

  figma.notify("✅  Created Tier 2 app components: Sidebar Item, Space Chip, Link Row, Capture Input, Dock Item.");
  figma.closePlugin();
}

// ─── Command: Create Onboarding Flow Screens ─────────────────────────────────

async function createOnboardingFlowScreens() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(function() {});
  await figma.loadFontAsync({ family: "Inter", style: "Bold" }).catch(function() {});

  var colorVars = figma.variables.getLocalVariables("COLOR");
  function getVar(name) { return colorVars.find(function(v) { return v.name === name; }) || null; }
  function makePaint(varName) {
    var base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    var variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }, "color", variable);
  }
  function applyFill(node, varName) { node.fills = varName ? [makePaint(varName)] : []; }
  function applyStroke(node, varName, weight) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = weight || 1;
    node.strokeAlign = "INSIDE";
  }
  function applyFillRecursive(node, varName) {
    if ("fills" in node && Array.isArray(node.fills) && node.fills !== figma.mixed) applyFill(node, varName);
    if ("children" in node && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) applyFillRecursive(node.children[i], varName);
    }
  }

  function mkText(chars, fs, lh, weight, colorVar, align, width) {
    var t = figma.createText();
    t.fontName = { family: "Inter", style: weight || "Regular" };
    t.fontSize = fs;
    t.lineHeight = { unit: "PIXELS", value: lh };
    t.characters = chars;
    if (width) {
      t.textAutoResize = "HEIGHT";
      t.resize(width, 10);
      t.textAlignHorizontal = align || "LEFT";
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    applyFill(t, colorVar || "fg/default");
    return t;
  }

  function findComponentInSet(setName, parts) {
    var set = figma.currentPage.findOne(function(n) {
      return n.type === "COMPONENT_SET" && n.name === setName;
    });
    if (!set) return null;
    var comps = set.findAll(function(n) { return n.type === "COMPONENT"; });
    for (var i = 0; i < comps.length; i++) {
      var ok = true;
      for (var p = 0; p < parts.length; p++) {
        if (comps[i].name.indexOf(parts[p]) === -1) { ok = false; break; }
      }
      if (ok) return comps[i];
    }
    return null;
  }

  function setFirstText(node, value) {
    var t = node.findOne(function(n) { return n.type === "TEXT"; });
    if (t) t.characters = value;
  }

  function makeCardButton(variant, label, addIcon, addArrow) {
    if (!addIcon && !addArrow) {
      var variantMap = { "default": "Default", "secondary": "Secondary", "ghost": "Ghost" };
      var comp = findComponentInSet("Cadie / Button / Text", ["Variant=" + (variantMap[variant] || "Default"), "Size=Default"]);
      if (comp) {
        var inst = comp.createInstance();
        setFirstText(inst, label);
        inst.resize(372, 48);
        return inst;
      }
    }

    var b = figma.createFrame();
    b.layoutMode = "HORIZONTAL";
    b.primaryAxisAlignItems = "CENTER";
    b.counterAxisAlignItems = "CENTER";
    b.primaryAxisSizingMode = "FIXED";
    b.counterAxisSizingMode = "FIXED";
    b.itemSpacing = 8;
    b.resize(372, 48);
    b.cornerRadius = 12;
    b.paddingLeft = 14;
    b.paddingRight = 14;
    if (variant === "default") {
      applyFill(b, "button/primary");
      b.strokes = [];
    } else if (variant === "secondary") {
      applyFill(b, "button/secondary");
      b.strokes = [];
    } else {
      b.fills = [];
      b.strokes = [];
    }

    if (addIcon === "google") {
      var g = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff"/></svg>');
      g.resize(24, 24);
      b.appendChild(g);
    } else if (addIcon === "link") {
      var link = figma.createNodeFromSvg('<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8.25a3.75 3.75 0 0 0-3.747 3.904M12 8.25a3.75 3.75 0 0 1 3.608 4.775M12 8.25h8.458m-4.85 4.775a3.752 3.752 0 0 1-7.355-.871m7.355.871l-3.08 8.21m7.93-12.985A9.252 9.252 0 0 0 4.6 6.45m15.858 1.8q.085.19.161.386a9.25 9.25 0 0 1-8.09 12.599m0 0A9.25 9.25 0 0 1 2.75 12c0-2.083.688-4.004 1.85-5.55m3.653 5.704L4.6 6.45" stroke="#666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      applyFillRecursive(link, "fg/default");
      b.appendChild(link);
    }

    var txtColor = variant === "default" ? "fg/on-accent" : "fg/default";
    var txt = mkText(label, 14, 24, "Medium", txtColor, "CENTER");
    b.appendChild(txt);

    if (addArrow) {
      var ar = figma.createNodeFromSvg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m9 18l6-6-6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      b.appendChild(ar);
    }
    return b;
  }

  function makeInput(placeholder, state) {
    var f = figma.createFrame();
    f.layoutMode = "HORIZONTAL";
    f.primaryAxisAlignItems = "CENTER";
    f.counterAxisAlignItems = "CENTER";
    f.primaryAxisSizingMode = "FIXED";
    f.counterAxisSizingMode = "FIXED";
    f.paddingLeft = 16;
    f.paddingRight = 16;
    f.resize(372, 56);
    f.cornerRadius = 12;
    applyFill(f, "bg/input");
    applyStroke(f, state === "focused" ? "accent/default" : "border/muted", 1);
    var color = state === "error" ? "destructive/default" : "fg/subtle";
    f.appendChild(mkText(placeholder, 14, 24, "Medium", color));
    return f;
  }

  function makeCadieLogo() {
    var node = figma.createNodeFromSvg('<svg width="83" height="25" viewBox="0 0 83 25"><path d="M11.552 22.784C14.592 22.784 16.224 20.896 17.44 17.152H19.2L18.528 22.816C16.512 23.936 14.272 24.672 10.912 24.672C4.224 24.672 0 20.032 0 13.6C0 6.144 4.992 1.568 11.296 1.568C14.56 1.568 16.896 2.432 18.432 3.68V8.672H16.704C15.84 5.12 14.016 3.424 11.136 3.424C6.4 3.424 4.448 7.712 4.448 12.672C4.448 18.464 6.848 22.784 11.552 22.784Z" fill="#888"/><path d="M34.736 12.736C34.736 13.504 34.64 19.168 34.64 20.16C34.64 21.44 35.056 22.176 35.952 22.176C36.24 22.176 36.944 22.112 37.424 21.984L37.616 23.008C36.528 24.096 35.312 24.672 33.968 24.672C32.272 24.672 31.344 23.488 30.96 21.76C29.84 23.104 28.112 24.64 25.68 24.64C22.832 24.64 21.36 22.752 21.36 20.256C21.36 17.312 23.632 16.288 25.776 15.552L30.864 13.728V12.032C30.864 9.952 30.224 8.544 28.112 8.544C26.544 8.544 25.776 9.312 25.776 10.784C25.776 11.392 25.84 11.936 26 12.608L23.184 13.024C22.576 12.608 22.288 12 22.288 11.136C22.288 8.352 25.008 6.88 28.688 6.88C32.624 6.88 34.736 8.64 34.736 12.736ZM27.664 22.016C28.912 22.016 29.776 21.664 30.864 20.896V15.296L27.12 16.736C25.936 17.184 25.264 18.048 25.264 19.264C25.264 21.024 26.128 22.016 27.664 22.016Z" fill="#888"/><path d="M50.3443 24.672V21.728C49.1283 23.488 47.5283 24.672 45.0323 24.672C40.8403 24.672 38.3123 21.28 38.3123 16.608C38.3123 10.592 41.9603 6.944 46.6643 6.944C48.2323 6.944 49.6403 7.488 50.3443 8.416V3.68L48.1683 2.336V1.504L53.3523 0H54.2163V20.544C54.2163 21.632 54.5363 21.952 55.8483 22.08L56.6483 22.144V23.584L51.0483 24.672H50.3443ZM46.7923 8.608C43.9763 8.608 42.2163 11.328 42.2163 15.264C42.2163 18.976 43.7523 22.016 46.8883 22.016C48.2003 22.016 49.5123 21.536 50.3443 20.768V12.672C50.3443 9.92 49.0323 8.608 46.7923 8.608Z" fill="#888"/><path d="M62.144 4.96C60.704 4.96 59.68 3.872 59.68 2.56C59.68 1.248 60.704 0.16 62.144 0.16C63.552 0.16 64.576 1.248 64.576 2.56C64.576 3.872 63.552 4.96 62.144 4.96ZM64.192 6.88V21.088C64.192 22.56 65.056 22.72 66.496 22.912V24.352H58.016V22.912C59.424 22.72 60.32 22.56 60.32 21.088V10.624L58.176 9.248V8.48L63.296 6.88H64.192Z" fill="#888"/><path d="M76.0947 6.88C80.4467 6.88 82.7188 9.952 82.7188 14.08V15.136H71.5508C71.5508 19.008 73.7268 21.6 77.1188 21.6C79.3908 21.6 80.8948 20.544 82.0468 19.008L82.7508 19.424C81.9508 22.528 79.5187 24.672 75.7747 24.672C71.0707 24.672 68.0947 21.12 68.0947 16.32C68.0947 10.656 71.5507 6.88 76.0947 6.88ZM75.5828 8.64C73.2788 8.64 71.9028 10.912 71.6468 13.504H79.1028C79.0708 10.56 77.9188 8.64 75.5828 8.64Z" fill="#888"/></svg>');
    applyFillRecursive(node, "fg/subtle");
    return node;
  }

  function makeShellScreen(name) {
    var s = figma.createFrame();
    s.name = name;
    s.layoutMode = "NONE";
    s.resize(1512, 982);
    applyFill(s, "bg/default");
    s.strokes = [];
    var logo = makeCadieLogo();
    logo.x = Math.round((1512 - logo.width) / 2);
    logo.y = 28;
    s.appendChild(logo);
    return s;
  }

  function makeCard() {
    var c = figma.createFrame();
    c.layoutMode = "VERTICAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    c.itemSpacing = 48;
    c.paddingLeft = 48;
    c.paddingRight = 48;
    c.paddingTop = 48;
    c.paddingBottom = 48;
    c.resize(468, 10);
    c.cornerRadius = 24;
    applyFill(c, "bg/elevated");
    c.strokes = [{ type: "SOLID", color: { r: 0.898, g: 0.898, b: 0.898 }, opacity: 1 }];
    c.strokeWeight = 1;
    c.effects = [
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.01 }, offset: { x: 0, y: 2 }, radius: 2, visible: true, blendMode: "NORMAL" },
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.01 }, offset: { x: 0, y: 4 }, radius: 4, visible: true, blendMode: "NORMAL" },
      { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.03 }, offset: { x: 0, y: 2 }, radius: 24, visible: true, blendMode: "NORMAL" }
    ];
    return c;
  }

  function makeHeader(title, subtitle) {
    var f = figma.createFrame();
    f.layoutMode = "VERTICAL";
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "FIXED";
    f.itemSpacing = 2;
    f.resize(372, 10);
    f.fills = [];
    f.strokes = [];
    f.appendChild(mkText(title, 18, 32, "Semi Bold", "fg/default", "CENTER", 372));
    f.appendChild(mkText(subtitle, 16, 32, "Medium", "fg/muted", "CENTER", 372));
    return f;
  }

  function placeCard(screen, card) {
    screen.appendChild(card);
    card.x = Math.round((1512 - card.width) / 2);
    card.y = 282;
  }

  function makeTerms() {
    return mkText("By continuing, you acknowledge that you understand and agree to the Terms & Conditions and Privacy Policy.", 12, 16, "Regular", "fg/subtle", "CENTER", 372);
  }

  function authScreen(state) {
    var s = makeShellScreen("Onboarding / Auth / " + state);
    var c = makeCard();
    c.appendChild(makeHeader("Welcome to Cadie", "Log in or sign up to get started."));
    var actions = figma.createFrame();
    actions.layoutMode = "VERTICAL";
    actions.primaryAxisSizingMode = "AUTO";
    actions.counterAxisSizingMode = "FIXED";
    actions.itemSpacing = 12;
    actions.resize(372, 10);
    actions.fills = [];
    actions.strokes = [];
    actions.appendChild(makeCardButton("default", state === "Google Loading" ? "Signing in with Google..." : "Continue with Google", "google", false));
    if (state === "Error") actions.appendChild(mkText("An error occurred. Please try again.", 14, 20, "Regular", "destructive/default", "CENTER", 372));
    actions.appendChild(makeCardButton("secondary", "Continue with Email", null, false));
    c.appendChild(actions);
    c.appendChild(makeTerms());
    placeCard(s, c);
    return s;
  }

  function authEmailScreen(state) {
    var s = makeShellScreen("Onboarding / Auth Email / " + state);
    var c = makeCard();
    c.appendChild(makeHeader("Continue with Email", "We'll send you a magic link to sign in."));
    var form = figma.createFrame();
    form.layoutMode = "VERTICAL";
    form.primaryAxisSizingMode = "AUTO";
    form.counterAxisSizingMode = "FIXED";
    form.itemSpacing = 12;
    form.resize(372, 10);
    form.fills = [];
    form.strokes = [];
    form.appendChild(makeInput("Enter your email", state === "Error" ? "error" : "default"));
    if (state === "Error") form.appendChild(mkText("An error occurred. Please try again.", 14, 20, "Regular", "destructive/default", "LEFT", 372));
    form.appendChild(makeCardButton("default", state === "Loading" ? "Sending..." : "Continue", null, false));
    form.appendChild(makeCardButton("ghost", "Back to sign in", null, false));
    c.appendChild(form);
    c.appendChild(makeTerms());
    placeCard(s, c);
    return s;
  }

  function welcomeScreen(state) {
    var s = makeShellScreen("Onboarding / Welcome / " + state);
    var c = makeCard();
    c.appendChild(makeHeader("Customize your Account", "Give your account a profile picture and name"));
    var avWrap = figma.createFrame();
    avWrap.layoutMode = "HORIZONTAL";
    avWrap.primaryAxisAlignItems = "CENTER";
    avWrap.counterAxisAlignItems = "CENTER";
    avWrap.primaryAxisSizingMode = "FIXED";
    avWrap.counterAxisSizingMode = "AUTO";
    avWrap.resize(372, 10);
    avWrap.fills = [];
    avWrap.strokes = [];
    var av = figma.createEllipse();
    av.resize(96, 96);
    applyFill(av, "bg/inverse");
    avWrap.appendChild(av);
    c.appendChild(avWrap);
    var form = figma.createFrame();
    form.layoutMode = "VERTICAL";
    form.primaryAxisSizingMode = "AUTO";
    form.counterAxisSizingMode = "FIXED";
    form.itemSpacing = 12;
    form.resize(372, 10);
    form.fills = [];
    form.strokes = [];
    form.appendChild(mkText("Your name", 14, 20, "Medium", "fg/subtle", "LEFT", 372));
    form.appendChild(makeInput("What should we call you?", state === "Name Error" ? "error" : "default"));
    if (state === "Name Error") form.appendChild(mkText("Please enter your name", 14, 20, "Regular", "destructive/default", "CENTER", 372));
    form.appendChild(makeCardButton("default", state === "Saving" ? "Setting up..." : "Continue", null, false));
    c.appendChild(form);
    placeCard(s, c);
    return s;
  }

  function extensionScreen(state) {
    var s = makeShellScreen("Onboarding / Extension / " + state);
    var c = makeCard();
    var top = figma.createFrame();
    top.layoutMode = "VERTICAL";
    top.primaryAxisAlignItems = "CENTER";
    top.counterAxisAlignItems = "CENTER";
    top.primaryAxisSizingMode = "AUTO";
    top.counterAxisSizingMode = "FIXED";
    top.itemSpacing = 18;
    top.resize(372, 10);
    top.fills = [];
    top.strokes = [];
    var chrome = figma.createNodeFromSvg('<svg width="256" height="223" viewBox="0 0 256 223" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a" x1="0%" x2="100%" y1="50%" y2="50%"><stop offset="0%" stop-color="#D93025"/><stop offset="100%" stop-color="#EA4335"/></linearGradient><linearGradient id="b" x1="74.943%" x2="19.813%" y1="95.826%" y2="-4.161%"><stop offset="0%" stop-color="#1E8E3E"/><stop offset="100%" stop-color="#34A853"/></linearGradient><linearGradient id="c" x1="59.898%" x2="21.416%" y1="-.134%" y2="99.86%"><stop offset="0%" stop-color="#FBBC04"/><stop offset="100%" stop-color="#FCC934"/></linearGradient></defs><path fill="#F1F3F4" d="M255.983 0H0v204.837c0 9.633 7.814 17.464 17.464 17.464h221.072c9.633 0 17.464-7.814 17.464-17.464z"/><path fill="#E8EAED" d="M0 0h255.983v111.74H0z"/><g transform="translate(17.455 94.293)"><path fill="url(#a)" d="m14.812 55.255l15.241 46.498l32.638 36.427l47.845-82.908l95.724-.017C187.146 22.213 151.443 0 110.536 0s-76.61 22.213-95.724 55.255"/><path fill="url(#b)" d="m110.52 221.105l32.637-36.443l15.224-46.482H62.674L14.812 55.255c-19.047 33.076-20.445 75.128.017 110.561c20.445 35.434 57.545 55.256 95.69 55.29"/><path fill="url(#c)" d="M206.26 55.272h-95.724l47.862 82.908l-47.862 82.925c38.162-.033 75.263-19.855 95.708-55.289c20.461-35.433 19.064-77.468.016-110.544"/><ellipse cx="110.536" cy="110.544" fill="#F1F3F4" rx="55.255" ry="55.272"/><ellipse cx="110.536" cy="110.544" fill="#1A73E8" rx="44.898" ry="44.915"/></g></svg>');
    chrome.resize(55, 48);
    top.appendChild(chrome);
    top.appendChild(makeHeader("One Click and it's saved!", "Save links you want to remember."));
    c.appendChild(top);
    var actions = figma.createFrame();
    actions.layoutMode = "VERTICAL";
    actions.primaryAxisSizingMode = "AUTO";
    actions.counterAxisSizingMode = "FIXED";
    actions.itemSpacing = 12;
    actions.resize(372, 10);
    actions.fills = [];
    actions.strokes = [];
    if (state === "Initial") {
      actions.appendChild(makeCardButton("secondary", "Add to Chrome", "link", false));
      actions.appendChild(makeCardButton("ghost", "I'll do this later", null, false));
    } else {
      actions.appendChild(mkText("After installing, click the extension icon to save any page!", 14, 20, "Regular", "fg/subtle", "CENTER", 372));
      actions.appendChild(makeCardButton("default", state === "Continue Loading" ? "Setting up..." : "Continue to Cadie", null, true));
    }
    c.appendChild(actions);
    placeCard(s, c);
    return s;
  }

  function themeScreen(state) {
    var s = makeShellScreen("Onboarding / Theme / " + state);
    var c = makeCard();
    c.appendChild(makeHeader("Choose your theme", "You can change this anytime in settings."));
    var row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 16;
    row.resize(372, 10);
    row.fills = [];
    row.strokes = [];
    function option(label, selected, dark) {
      var o = figma.createFrame();
      o.layoutMode = "VERTICAL";
      o.primaryAxisSizingMode = "FIXED";
      o.counterAxisSizingMode = "AUTO";
      o.itemSpacing = 12;
      o.paddingLeft = 16;
      o.paddingRight = 16;
      o.paddingTop = 16;
      o.paddingBottom = 16;
      o.resize(178, 10);
      o.cornerRadius = 16;
      o.fills = [];
      applyStroke(o, selected ? "accent/default" : "border/muted", selected ? 2 : 1);
      var p = figma.createFrame();
      p.layoutMode = "NONE";
      p.resize(146, 110);
      p.cornerRadius = 8;
      p.strokes = [];
      p.fills = [{ type: "SOLID", color: dark ? { r: 0.086, g: 0.086, b: 0.086 } : { r: 0.973, g: 0.973, b: 0.973 } }];
      o.appendChild(p);
      o.appendChild(mkText(label, 14, 20, "Medium", "fg/default", "CENTER", 146));
      return o;
    }
    row.appendChild(option("Light", state === "Light Selected" || state === "Saving", false));
    row.appendChild(option("Dark", state === "Dark Selected", true));
    c.appendChild(row);
    c.appendChild(makeCardButton("default", state === "Saving" ? "Setting up..." : "Continue", null, false));
    placeCard(s, c);
    return s;
  }

  function completionScreen(state) {
    var s = makeShellScreen("Onboarding / Completion / " + state);
    if (state === "Final") {
      var center = figma.createFrame();
      center.layoutMode = "VERTICAL";
      center.primaryAxisAlignItems = "CENTER";
      center.counterAxisAlignItems = "CENTER";
      center.primaryAxisSizingMode = "AUTO";
      center.counterAxisSizingMode = "AUTO";
      center.itemSpacing = 24;
      center.fills = [];
      center.strokes = [];
      center.appendChild(mkText("Your library for the internet", 32, 40, "Medium", "fg/default"));
      center.appendChild(makeCardButton("default", "Let's begin", null, false));
      s.appendChild(center);
      center.x = Math.round((1512 - center.width) / 2);
      center.y = 420;
    }
    return s;
  }

  var old = figma.currentPage.findAll(function(n) {
    return n.type === "FRAME" && (
      n.name.indexOf("Cadie / Onboarding / Mirror /") === 0 ||
      n.name === "Cadie / Onboarding / Flow"
    );
  });
  for (var oi = 0; oi < old.length; oi++) old[oi].remove();

  var startY = 0;
  for (var c = 0; c < figma.currentPage.children.length; c++) {
    var bb = figma.currentPage.children[c].y + figma.currentPage.children[c].height;
    if (bb > startY) startY = bb;
  }
  startY += 120;

  var rows = [
    [authScreen("Default"), authScreen("Google Loading"), authScreen("Error")],
    [authEmailScreen("Default"), authEmailScreen("Loading"), authEmailScreen("Error")],
    [welcomeScreen("Default"), welcomeScreen("Name Error"), welcomeScreen("Saving")],
    [extensionScreen("Initial"), extensionScreen("Installed"), extensionScreen("Continue Loading")],
    [themeScreen("Light Selected"), themeScreen("Dark Selected"), themeScreen("Saving")],
    [completionScreen("Intro"), completionScreen("Final")]
  ];

  var gapX = 120;
  var gapY = 120;
  var y = startY;
  var all = [];
  for (var r = 0; r < rows.length; r++) {
    var x = 0;
    var rowH = 0;
    for (var k = 0; k < rows[r].length; k++) {
      var node = rows[r][k];
      node.name = "Cadie / Onboarding / Mirror / " + node.name;
      node.x = x;
      node.y = y;
      figma.currentPage.appendChild(node);
      all.push(node);
      x += node.width + gapX;
      if (node.height > rowH) rowH = node.height;
    }
    y += rowH + gapY;
  }

  figma.viewport.scrollAndZoomIntoView(all);
  figma.notify("✅  Rebuilt onboarding as app-mirrored screens (values, logo assets, and states).");
  figma.closePlugin();
}

// ─── Command: Create Home Mirror Screens ─────────────────────────────────────

async function createHomeMirrorScreens() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(function() {});
  await figma.loadFontAsync({ family: "Inter", style: "Bold" }).catch(function() {});

  var colorVars = figma.variables.getLocalVariables("COLOR");
  function getVar(name) { return colorVars.find(function(v) { return v.name === name; }) || null; }
  function makePaint(varName) {
    var base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    var variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } },
      "color",
      variable
    );
  }
  function applyFill(node, varName) { node.fills = varName ? [makePaint(varName)] : []; }
  function applyStroke(node, varName, weight) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = weight || 1;
    node.strokeAlign = "INSIDE";
  }
  function applyFillRecursive(node, varName) {
    if ("fills" in node && Array.isArray(node.fills) && node.fills !== figma.mixed) applyFill(node, varName);
    if ("children" in node && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) applyFillRecursive(node.children[i], varName);
    }
  }

  function mkText(chars, fs, lh, weight, colorVar, align, width) {
    var t = figma.createText();
    t.fontName = { family: "Inter", style: weight || "Regular" };
    t.fontSize = fs;
    t.lineHeight = { unit: "PIXELS", value: lh };
    t.characters = chars;
    if (width) {
      t.textAutoResize = "HEIGHT";
      t.resize(width, 10);
      t.textAlignHorizontal = align || "LEFT";
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    applyFill(t, colorVar || "fg/default");
    return t;
  }

  function makeLogoIcon() {
    return figma.createNodeFromSvg(
      '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_50_50)"><rect x="6" y="5" width="19" height="22" fill="#F6F4EE"/><path fill-rule="evenodd" clip-rule="evenodd" d="M15.9999 0.571533C11.2181 0.571533 7.321 1.9201 4.61929 4.61953C1.91757 7.31896 0.571289 11.2184 0.571289 16.0001C0.571289 20.7818 1.91986 24.679 4.61929 27.3807C7.31872 30.0824 11.2181 31.4287 15.9999 31.4287C20.7816 31.4287 24.6787 30.0801 27.3804 27.3807C30.0821 24.6812 31.4284 20.7818 31.4284 16.0001C31.4284 11.2184 30.0799 7.32125 27.3804 4.61953C24.681 1.91782 20.7816 0.571533 15.9999 0.571533ZM7.18386 15.9567C7.18407 14.0684 7.7351 12.2213 8.76943 10.6415C9.80375 9.0618 11.2764 7.81809 13.007 7.06282C14.7376 6.30754 16.651 6.07351 18.5126 6.3894C20.3742 6.70529 22.1033 7.55737 23.4879 8.84125C23.9427 9.26411 23.8947 9.84239 23.6707 10.231C23.5515 10.4339 23.3821 10.6027 23.1787 10.7212C22.9753 10.8397 22.7449 10.9039 22.5096 10.9075C21.8373 10.8932 21.169 11.0133 20.5437 11.2607C19.9185 11.508 19.3489 11.8778 18.8684 12.3481C18.3879 12.8185 18.0062 13.3801 17.7456 13.9999C17.4849 14.6198 17.3507 15.2854 17.3507 15.9578C17.3507 16.6302 17.4849 17.2959 17.7456 17.9157C18.0062 18.5356 18.3879 19.0971 18.8684 19.5675C19.3489 20.0379 19.9185 20.4076 20.5437 20.655C21.169 20.9024 21.8373 21.0224 22.5096 21.0081C23.0239 21.0081 23.4513 21.3098 23.6707 21.6847C23.8947 22.0732 23.9427 22.6515 23.4879 23.0744C22.1031 24.3584 20.3739 25.2105 18.512 25.5263C16.6502 25.8421 14.7367 25.6079 13.006 24.8524C11.2753 24.0968 9.80264 22.8528 8.76849 21.2727C7.73434 19.6926 7.18363 17.8451 7.18386 15.9567Z" fill="#343433"/></g><defs><clipPath id="clip0_50_50"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>'
    );
  }

  var TABLER_ICONS = {
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg>',
    dots: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>',
    layoutList: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M4 14m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/></svg>',
    layoutGrid: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/></svg>',
    arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>',
    arrowDown: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>',
    upload: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 9l5 -5l5 5"/><path d="M12 4l0 12"/></svg>',
    palette: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"/><path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>',
    notes: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/><path d="M9 7l6 0"/><path d="M9 11l6 0"/><path d="M9 15l4 0"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>',
    pin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4"/><path d="M9 15l-4.5 4.5"/><path d="M14.5 4l5.5 5.5"/></svg>',
    pinnedOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3l18 18"/><path d="M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251"/><path d="M9 15l-4.5 4.5"/><path d="M14.5 4l5.5 5.5"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>',
    restore: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3.06 13a9 9 0 1 0 .49 -4.087"/><path d="M3 4.001v5h5"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>',
    externalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/><path d="M11 13l9 -9"/><path d="M15 4h5v5"/></svg>',
    message: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/></svg>',
    ship: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"/><path d="M4 18l-1 -5h18l-2 4"/><path d="M5 13v-6h8l4 6"/><path d="M7 7v-4h-1"/></svg>',
    brandX: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>',
    keyboard: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 6m0 2a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z"/><path d="M6 10l0 .01"/><path d="M10 10l0 .01"/><path d="M14 10l0 .01"/><path d="M18 10l0 .01"/><path d="M6 14l0 .01"/><path d="M18 14l0 .01"/><path d="M10 14l4 .01"/></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/><path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 17l0 .01"/><path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4"/></svg>',
    arrowsSort: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 9l4 -4l4 4m-4 -4v14"/><path d="M21 15l-4 4l-4 -4m4 4v-14"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>',
    cornerDownLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6v6a3 3 0 0 1 -3 3h-10l4 -4m0 8l-4 -4"/></svg>',
    fileTypePdf: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"/><path d="M17 18h2"/><path d="M20 15h-3v6"/><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z"/></svg>',
    photo: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 8h.01"/><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"/><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"/></svg>',
    capsule: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 5h-6a7 7 0 1 0 0 14h6a7 7 0 0 0 7 -7l-.007 -.303a7 7 0 0 0 -6.993 -6.697z"/></svg>',
    circleCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"/></svg>',
    chevronUpDown: '<svg viewBox="5 3 8 12" xmlns="http://www.w3.org/2000/svg"><path d="M6.57269 7.32232L9.00313 4.96545L11.4336 7.32232C11.6778 7.55923 12.0725 7.55923 12.3168 7.32232C12.5611 7.08542 12.5611 6.70273 12.3168 6.46583L9.44161 3.67768C9.19731 3.44078 8.80269 3.44078 8.55839 3.67768L5.68322 6.46583C5.43892 6.70273 5.43892 7.08542 5.68322 7.32232C5.92752 7.55315 6.32839 7.55922 6.57269 7.32232Z" fill="#111111"/><path d="M11.4273 10.6777L8.99687 13.0345L6.56644 10.6777C6.32215 10.4408 5.92752 10.4408 5.68322 10.6777C5.43893 10.9146 5.43893 11.2973 5.68322 11.5342L8.55839 14.3223C8.80269 14.5592 9.19731 14.5592 9.44161 14.3223L12.3168 11.5342C12.5611 11.2973 12.5611 10.9146 12.3168 10.6777C12.0725 10.4468 11.6716 10.4408 11.4273 10.6777Z" fill="#111111"/></svg>',
    trashFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z"/><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z"/></svg>',
    pinFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15.113 3.21l.094 .083l5.5 5.5a1 1 0 0 1 -1.175 1.59l-3.172 3.171l-1.424 3.797a1 1 0 0 1 -.158 .277l-.07 .08l-1.5 1.5a1 1 0 0 1 -1.32 .082l-.095 -.083l-2.793 -2.792l-3.793 3.792a1 1 0 0 1 -1.497 -1.32l.083 -.094l3.792 -3.793l-2.792 -2.793a1 1 0 0 1 -.083 -1.32l.083 -.094l1.5 -1.5a1 1 0 0 1 .258 -.187l.098 -.042l3.796 -1.425l3.171 -3.17a1 1 0 0 1 1.497 -1.26z"/></svg>',
    linkChain: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#111111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#111111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function tintIcon(node, varName) {
    function tintPaints(paints) {
      if (!Array.isArray(paints)) return paints;
      var out = [];
      for (var i = 0; i < paints.length; i++) {
        var p = paints[i];
        if (p.type !== "SOLID") { out.push(p); continue; }
        var np = { type: "SOLID", color: { r: 0.07, g: 0.07, b: 0.07 }, opacity: p.opacity == null ? 1 : p.opacity };
        var variable = getVar(varName);
        if (variable) {
          out.push(figma.variables.setBoundVariableForPaint(np, "color", variable));
        } else {
          out.push(np);
        }
      }
      return out;
    }

    if ("fills" in node && node.fills !== figma.mixed) {
      try { node.fills = tintPaints(node.fills); } catch (_) {}
    }
    if ("strokes" in node && node.strokes !== figma.mixed) {
      try { node.strokes = tintPaints(node.strokes); } catch (_) {}
    }
    if ("children" in node && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) tintIcon(node.children[i], varName);
    }
  }

  function hexToRgb01(hex) {
    if (!hex) return { r: 0.65, g: 0.65, b: 0.65 };
    var s = String(hex).replace("#", "");
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    if (!isFinite(n)) return { r: 0.65, g: 0.65, b: 0.65 };
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }

  function tintIconHex(node, hex) {
    var rgb = hexToRgb01(hex);
    function tintPaints(paints) {
      if (!Array.isArray(paints)) return paints;
      var out = [];
      for (var i = 0; i < paints.length; i++) {
        var p = paints[i];
        if (p.type !== "SOLID") { out.push(p); continue; }
        out.push({ type: "SOLID", color: { r: rgb.r, g: rgb.g, b: rgb.b }, opacity: p.opacity == null ? 1 : p.opacity });
      }
      return out;
    }
    if ("fills" in node && node.fills !== figma.mixed) {
      try { node.fills = tintPaints(node.fills); } catch (_) {}
    }
    if ("strokes" in node && node.strokes !== figma.mixed) {
      try { node.strokes = tintPaints(node.strokes); } catch (_) {}
    }
    if ("children" in node && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) tintIconHex(node.children[i], hex);
    }
  }

  function makeTablerIcon(name, size, colorVar) {
    var svg = TABLER_ICONS[name] || TABLER_ICONS.dots;
    var node = figma.createNodeFromSvg(svg);
    tintIcon(node, colorVar || "fg/default");
    node.resize(size, size);
    return node;
  }

  function makeTablerIconHex(name, size, hex) {
    var svg = TABLER_ICONS[name] || TABLER_ICONS.dots;
    var node = figma.createNodeFromSvg(svg);
    tintIconHex(node, hex);
    node.resize(size, size);
    return node;
  }

  function makeUserAvatar() {
    var f = figma.createFrame();
    f.layoutMode = "HORIZONTAL";
    f.primaryAxisAlignItems = "CENTER";
    f.counterAxisAlignItems = "CENTER";
    f.primaryAxisSizingMode = "FIXED";
    f.counterAxisSizingMode = "FIXED";
    f.resize(36, 36);
    f.cornerRadius = 18;
    applyFill(f, "bg/inverse");
    var t = mkText("H", 14, 16, "Medium", "fg/inverse");
    f.appendChild(t);
    return f;
  }

  function makeIconLabel(label, bg, fg) {
    var chip = figma.createFrame();
    chip.layoutMode = "HORIZONTAL";
    chip.primaryAxisAlignItems = "CENTER";
    chip.counterAxisAlignItems = "CENTER";
    chip.primaryAxisSizingMode = "AUTO";
    chip.counterAxisSizingMode = "AUTO";
    chip.paddingLeft = 6;
    chip.paddingRight = 6;
    chip.paddingTop = 1;
    chip.paddingBottom = 1;
    chip.cornerRadius = 999;
    applyFill(chip, bg);
    chip.strokes = [];
    chip.appendChild(mkText(label, 10, 14, "Medium", fg));
    return chip;
  }

  function makeSurfaceMenu(width) {
    var m = figma.createFrame();
    m.layoutMode = "VERTICAL";
    m.primaryAxisSizingMode = "AUTO";
    m.counterAxisSizingMode = "FIXED";
    m.itemSpacing = 2;
    m.paddingLeft = 6;
    m.paddingRight = 6;
    m.paddingTop = 6;
    m.paddingBottom = 6;
    m.resize(width, 10);
    m.cornerRadius = 14;
    m.fills = [{
      type: "GRADIENT_LINEAR",
      gradientStops: [
        { position: 0, color: { r: 0.16, g: 0.16, b: 0.16, a: 0.94 } },
        { position: 1, color: { r: 0.03, g: 0.03, b: 0.03, a: 0.94 } }
      ],
      gradientTransform: [[1, 0, 0], [0, 1, 0]]
    }];
    m.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.16 }];
    m.strokeWeight = 1;
    return m;
  }

  function addMenuItem(menu, label, destructive, iconName, shortcut, iconHex) {
    var item = figma.createFrame();
    item.layoutMode = "HORIZONTAL";
    item.primaryAxisAlignItems = "CENTER";
    item.counterAxisAlignItems = "CENTER";
    item.primaryAxisSizingMode = "FIXED";
    item.counterAxisSizingMode = "FIXED";
    item.itemSpacing = 8;
    item.paddingLeft = 8;
    item.paddingRight = 8;
    item.resize(menu.width - 12, 32);
    item.cornerRadius = 8;
    item.fills = [];
    item.strokes = [];

    var left = figma.createFrame();
    left.layoutMode = "HORIZONTAL";
    left.primaryAxisAlignItems = "CENTER";
    left.counterAxisAlignItems = "CENTER";
    left.primaryAxisSizingMode = "AUTO";
    left.counterAxisSizingMode = "AUTO";
    left.itemSpacing = 8;
    left.fills = [];
    left.strokes = [];
    if (iconName) {
      if (iconHex) left.appendChild(makeTablerIconHex(iconName, 14, iconHex));
      else left.appendChild(makeTablerIcon(iconName, 14, destructive ? "destructive/default" : "overlay/text-secondary"));
    }
    left.appendChild(mkText(label, 14, 20, "Medium", destructive ? "destructive/default" : "overlay/text-primary"));
    item.appendChild(left);

    var spacer = figma.createFrame();
    spacer.resize(12, 1);
    spacer.fills = [];
    spacer.strokes = [];
    item.appendChild(spacer);

    if (shortcut) item.appendChild(mkText(shortcut, 11, 16, "Medium", "overlay/text-secondary"));
    menu.appendChild(item);
  }

  function addMenuDivider(menu) {
    var d = figma.createRectangle();
    d.resize(menu.width - 12, 1);
    d.cornerRadius = 1;
    d.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.12 }];
    d.strokes = [];
    menu.appendChild(d);
  }

  var links = [
    { title: "Stripe: Building resilient checkout flows", domain: "stripe.com", url: "https://stripe.com/blog", type: "link", pinned: true, created: "2h", tags: ["payments", "api"] },
    { title: "Vercel: Next.js performance deep dive", domain: "vercel.com", url: "https://vercel.com/blog", type: "link", pinned: true, created: "4h", tags: ["next.js", "infra"] },
    { title: "Linear roadmap for startup teams", domain: "linear.app", url: "https://linear.app/changelog", type: "link", pinned: false, created: "7h", tags: ["product"] },
    { title: "Figma Dev Mode updates for engineers", domain: "figma.com", url: "https://figma.com/blog", type: "link", pinned: false, created: "1d", tags: ["design", "dx"] },
    { title: "Supabase Launch Week recap", domain: "supabase.com", url: "https://supabase.com/blog", type: "link", pinned: false, created: "1d", tags: ["backend"] },
    { title: "OpenAI product release notes", domain: "openai.com", url: "https://openai.com/index", type: "link", pinned: false, created: "2d", tags: ["ai"] },
    { title: "Notion startup operating system template", domain: "notion.so", url: "https://notion.so/templates", type: "link", pinned: false, created: "3d", tags: ["ops"] },
    { title: "YC Demo Day Team Photo", domain: "images.unsplash.com", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", type: "image", pinned: false, created: "3d", tags: ["image"] },
    { title: "Seed Round Pitch Deck (PDF)", domain: "docs.cadie.app", url: "https://docs.cadie.app/samples/seed-deck.pdf", type: "document", pinned: false, created: "5d", tags: ["document"] },
    { title: "Product brainstorm notes", domain: "note", url: "note://product-brainstorm", type: "note", pinned: false, created: "7d", tags: ["note"] }
  ];

  var spaces = [
    { name: "Product", color: "#2783DE", count: 28 },
    { name: "Fundraising", color: "#FF9F0A", count: 9 },
    { name: "Design", color: "#34C759", count: 16 },
    { name: "Growth", color: "#FF3B30", count: 13 }
  ];

  var SCREEN_W = 1512;
  var SCREEN_H = 982;

  function makeHomeShell(name, opts) {
    var screen = figma.createFrame();
    screen.name = name;
    screen.layoutMode = "NONE";
    screen.resize(SCREEN_W, SCREEN_H);
    applyFill(screen, "bg/default");
    screen.strokes = [];

    var topHeader = figma.createFrame();
    topHeader.layoutMode = "HORIZONTAL";
    topHeader.primaryAxisAlignItems = "CENTER";
    topHeader.counterAxisAlignItems = "CENTER";
    topHeader.primaryAxisSizingMode = "FIXED";
    topHeader.counterAxisSizingMode = "FIXED";
    topHeader.paddingLeft = 32;
    topHeader.paddingRight = 32;
    topHeader.resize(SCREEN_W, 64);
    topHeader.fills = [];
    topHeader.strokes = [];

    var logoBtn = figma.createFrame();
    logoBtn.layoutMode = "HORIZONTAL";
    logoBtn.primaryAxisAlignItems = "CENTER";
    logoBtn.counterAxisAlignItems = "CENTER";
    logoBtn.primaryAxisSizingMode = "AUTO";
    logoBtn.counterAxisSizingMode = "AUTO";
    logoBtn.fills = [];
    logoBtn.strokes = [];
    logoBtn.appendChild(makeLogoIcon());
    topHeader.appendChild(logoBtn);
    topHeader.appendChild(makeIconLabel("Beta", "bg/muted", "fg/muted"));

    var spacer = figma.createFrame();
    spacer.layoutMode = "NONE";
    spacer.primaryAxisSizingMode = "FIXED";
    spacer.counterAxisSizingMode = "FIXED";
    spacer.resize(1240, 1);
    spacer.fills = [];
    spacer.strokes = [];
    topHeader.appendChild(spacer);
    topHeader.appendChild(makeUserAvatar());
    screen.appendChild(topHeader);

    if (opts && opts.warning) {
      var warnWrap = figma.createFrame();
      warnWrap.layoutMode = "NONE";
      warnWrap.resize(896, 32);
      warnWrap.x = Math.round((SCREEN_W - 896) / 2);
      warnWrap.y = 66;
      warnWrap.cornerRadius = 8;
      applyFill(warnWrap, opts.warningType === "danger" ? "destructive/muted" : "warning/muted");
      warnWrap.strokes = [];
      warnWrap.appendChild(mkText(opts.warning, 13, 20, "Regular", opts.warningType === "danger" ? "destructive/default" : "warning/default", "LEFT", 860));
      screen.appendChild(warnWrap);
    }

    var controlBar = figma.createFrame();
    controlBar.layoutMode = "HORIZONTAL";
    controlBar.primaryAxisAlignItems = "CENTER";
    controlBar.counterAxisAlignItems = "CENTER";
    controlBar.primaryAxisSizingMode = "FIXED";
    controlBar.counterAxisSizingMode = "FIXED";
    controlBar.paddingLeft = 0;
    controlBar.paddingRight = 0;
    controlBar.resize(896, 56);
    controlBar.x = Math.round((SCREEN_W - 896) / 2);
    controlBar.y = opts && opts.warning ? 102 : 86;
    controlBar.fills = [];
    controlBar.strokes = [];

    var left = figma.createFrame();
    left.layoutMode = "HORIZONTAL";
    left.primaryAxisAlignItems = "CENTER";
    left.counterAxisAlignItems = "CENTER";
    left.primaryAxisSizingMode = "AUTO";
    left.counterAxisSizingMode = "AUTO";
    left.itemSpacing = 10;
    left.fills = [];
    left.strokes = [];
    controlBar.appendChild(left);

    var addBtn = figma.createFrame();
    addBtn.name = "Anchor / Add";
    addBtn.layoutMode = "HORIZONTAL";
    addBtn.primaryAxisAlignItems = "CENTER";
    addBtn.counterAxisAlignItems = "CENTER";
    addBtn.primaryAxisSizingMode = "FIXED";
    addBtn.counterAxisSizingMode = "FIXED";
    addBtn.resize(36, 36);
    addBtn.cornerRadius = 8;
    applyFill(addBtn, "bg/field-light");
    applyStroke(addBtn, "border/default", 1);
    addBtn.appendChild(makeTablerIcon("plus", 16, "fg/default"));
    left.appendChild(addBtn);

    var divider = figma.createRectangle();
    divider.resize(1, 32);
    divider.fills = [makePaint("border/muted")];
    divider.strokes = [];
    left.appendChild(divider);

    var viewBtn = figma.createFrame();
    viewBtn.name = "Anchor / View";
    viewBtn.layoutMode = "HORIZONTAL";
    viewBtn.primaryAxisAlignItems = "CENTER";
    viewBtn.counterAxisAlignItems = "CENTER";
    viewBtn.primaryAxisSizingMode = "AUTO";
    viewBtn.counterAxisSizingMode = "AUTO";
    viewBtn.itemSpacing = 8;
    viewBtn.paddingLeft = 8;
    viewBtn.paddingRight = 8;
    viewBtn.paddingTop = 6;
    viewBtn.paddingBottom = 6;
    viewBtn.cornerRadius = 8;
    viewBtn.fills = [];
    viewBtn.strokes = [];

    viewBtn.appendChild(makeTablerIcon(opts && opts.isTrash ? "trashFilled" : "capsule", 16, opts && opts.isTrash ? "destructive/default" : "fg/muted"));
    viewBtn.appendChild(mkText(opts && opts.title ? opts.title : "All", 22, 32, "Medium", "fg/default"));
    viewBtn.appendChild(makeTablerIcon("chevronUpDown", 12, "fg/subtle"));
    if (opts && opts.isTrash) {
      viewBtn.appendChild(makeIconLabel("Auto-deletes in 60 days", "bg/muted", "fg/subtle"));
    }
    left.appendChild(viewBtn);

    var rightSpacer = figma.createFrame();
    rightSpacer.resize(190, 1);
    rightSpacer.fills = [];
    rightSpacer.strokes = [];
    controlBar.appendChild(rightSpacer);

    var right = figma.createFrame();
    right.layoutMode = "HORIZONTAL";
    right.primaryAxisAlignItems = "CENTER";
    right.counterAxisAlignItems = "CENTER";
    right.primaryAxisSizingMode = "AUTO";
    right.counterAxisSizingMode = "AUTO";
    right.itemSpacing = 8;
    right.fills = [];
    right.strokes = [];

    var search = figma.createFrame();
    search.layoutMode = "HORIZONTAL";
    search.primaryAxisAlignItems = "CENTER";
    search.counterAxisAlignItems = "CENTER";
    search.primaryAxisSizingMode = "FIXED";
    search.counterAxisSizingMode = "FIXED";
    search.itemSpacing = 8;
    search.paddingLeft = 10;
    search.paddingRight = 10;
    search.resize(250, 36);
    search.cornerRadius = 8;
    applyFill(search, "bg/input");
    search.strokes = [];
    search.appendChild(makeTablerIcon("search", 14, "fg/subtle"));
    search.appendChild(mkText(opts && opts.search ? opts.search : "Search...", 13, 20, "Regular", opts && opts.search ? "fg/default" : "fg/subtle"));
    var searchKbd = figma.createFrame();
    searchKbd.layoutMode = "HORIZONTAL";
    searchKbd.primaryAxisAlignItems = "CENTER";
    searchKbd.counterAxisAlignItems = "CENTER";
    searchKbd.primaryAxisSizingMode = "AUTO";
    searchKbd.counterAxisSizingMode = "AUTO";
    searchKbd.paddingLeft = 6;
    searchKbd.paddingRight = 6;
    searchKbd.paddingTop = 2;
    searchKbd.paddingBottom = 2;
    searchKbd.cornerRadius = 5;
    applyFill(searchKbd, "bg/muted");
    searchKbd.strokes = [];
    searchKbd.appendChild(mkText("/", 10, 12, "Medium", "fg/subtle"));
    search.appendChild(searchKbd);
    right.appendChild(search);

    var options = figma.createFrame();
    options.name = "Anchor / Options";
    options.layoutMode = "HORIZONTAL";
    options.primaryAxisAlignItems = "CENTER";
    options.counterAxisAlignItems = "CENTER";
    options.primaryAxisSizingMode = "FIXED";
    options.counterAxisSizingMode = "FIXED";
    options.resize(36, 36);
    options.cornerRadius = 8;
    applyFill(options, "bg/input");
    options.strokes = [];
    options.appendChild(makeTablerIcon("dots", 16, "fg/default"));
    right.appendChild(options);
    controlBar.appendChild(right);
    screen.appendChild(controlBar);

    var colHead = figma.createFrame();
    colHead.layoutMode = "HORIZONTAL";
    colHead.primaryAxisAlignItems = "CENTER";
    colHead.counterAxisAlignItems = "CENTER";
    colHead.primaryAxisSizingMode = "FIXED";
    colHead.counterAxisSizingMode = "FIXED";
    colHead.resize(896, 24);
    colHead.x = Math.round((SCREEN_W - 896) / 2);
    colHead.y = controlBar.y + 56;
    colHead.fills = [];
    colHead.strokes = [];
    if (!opts || opts.viewMode !== "grid") {
      colHead.appendChild(mkText("Title", 12, 16, "Medium", "fg/subtle"));
      var fillGap = figma.createFrame();
      fillGap.resize(760, 1);
      fillGap.fills = [];
      fillGap.strokes = [];
      colHead.appendChild(fillGap);
      colHead.appendChild(mkText("Created", 12, 16, "Medium", "fg/subtle"));
      screen.appendChild(colHead);
    }

    var dividerRow = figma.createRectangle();
    dividerRow.resize(896, 1);
    dividerRow.x = Math.round((SCREEN_W - 896) / 2);
    dividerRow.y = colHead.y + (opts && opts.viewMode === "grid" ? 10 : 24);
    dividerRow.fills = [makePaint("border/muted")];
    dividerRow.strokes = [];
    screen.appendChild(dividerRow);

    return {
      screen: screen,
      addAnchor: { x: controlBar.x + 0, y: controlBar.y + 10 },
      viewAnchor: { x: controlBar.x + 56, y: controlBar.y + 0 },
      optionsAnchor: { x: controlBar.x + 860, y: controlBar.y + 0 },
      contentY: dividerRow.y + 24,
      listX: Math.round((SCREEN_W - 896) / 2),
      listW: 896,
      gridX: 24,
      gridW: SCREEN_W - 48
    };
  }

  function drawListRows(shell, opts) {
    var y = shell.contentY;
    var pinned = links.filter(function(l) { return l.pinned; });
    var rest = links.filter(function(l) { return !l.pinned; });
    var rows = [];

    function drawHeader(text) {
      var h = mkText(text, 11, 14, "Semi Bold", "fg/muted");
      h.x = shell.listX;
      h.y = y;
      shell.screen.appendChild(h);
      y += 28;
    }

    function drawRow(link, index, selected) {
      var row = figma.createFrame();
      row.layoutMode = "NONE";
      row.resize(shell.listW + 16, 64);
      row.x = shell.listX - 8;
      row.y = y;
      row.cornerRadius = 8;
      if (selected) applyFill(row, "bg/hover"); else row.fills = [];
      row.strokes = [];

      var iconWrap = figma.createFrame();
      iconWrap.layoutMode = "HORIZONTAL";
      iconWrap.primaryAxisAlignItems = "CENTER";
      iconWrap.counterAxisAlignItems = "CENTER";
      iconWrap.primaryAxisSizingMode = "FIXED";
      iconWrap.counterAxisSizingMode = "FIXED";
      iconWrap.resize(20, 20);
      iconWrap.cornerRadius = link.type === "link" ? 10 : 4;
      iconWrap.x = 12;
      iconWrap.y = 22;
      if (link.type === "link") {
        applyFill(iconWrap, "bg/muted");
        iconWrap.appendChild(mkText(link.domain.charAt(0).toUpperCase(), 10, 10, "Medium", "fg/muted"));
      } else if (link.type === "image") {
        applyFill(iconWrap, "bg/muted");
        iconWrap.appendChild(makeTablerIcon("photo", 14, "fg/subtle"));
      } else if (link.type === "document") {
        applyFill(iconWrap, "bg/muted");
        iconWrap.appendChild(makeTablerIcon("fileTypePdf", 14, "fg/subtle"));
      } else {
        applyFill(iconWrap, "bg/muted");
        iconWrap.appendChild(makeTablerIcon("notes", 14, "fg/subtle"));
      }
      row.appendChild(iconWrap);

      var title = mkText(link.title, 14, 16, "Medium", "fg/default", "LEFT", 560);
      title.x = 44;
      title.y = 16;
      row.appendChild(title);

      var meta = mkText(link.type === "link" ? link.domain : link.url, 13, 16, "Regular", "fg/subtle", "LEFT", 560);
      meta.x = 44;
      meta.y = 35;
      row.appendChild(meta);

      var created = mkText(link.created, 13, 16, "Regular", "fg/subtle");
      created.x = shell.listW - 64;
      created.y = 24;
      row.appendChild(created);

      if (link.pinned) {
        var pin = makeTablerIcon("pinFilled", 12, "fg/subtle");
        pin.x = shell.listW - 92;
        pin.y = 26;
        row.appendChild(pin);
      }
      shell.screen.appendChild(row);
      rows.push(row);
      y += 66;
    }

    if (pinned.length > 0) {
      drawHeader("PINNED");
      for (var i = 0; i < pinned.length; i++) drawRow(pinned[i], i, opts && opts.selectedRows && opts.selectedRows.indexOf(i) !== -1);
    }
    drawHeader("ALL LINKS");
    for (var j = 0; j < rest.length; j++) {
      var globalIndex = pinned.length + j;
      drawRow(rest[j], globalIndex, opts && opts.selectedRows && opts.selectedRows.indexOf(globalIndex) !== -1);
    }

    return { rows: rows, nextY: y };
  }

  function drawInlineAdd(shell) {
    var row = figma.createFrame();
    row.layoutMode = "NONE";
    row.resize(shell.listW + 16, 64);
    row.x = shell.listX - 8;
    row.y = shell.contentY;
    row.cornerRadius = 8;
    row.fills = [];
    row.strokes = [];

    var icon = figma.createRectangle();
    icon.resize(20, 20);
    icon.cornerRadius = 4;
    icon.x = 12;
    icon.y = 22;
    applyFill(icon, "bg/muted");
    row.appendChild(icon);
    var input = mkText("https://retool.com/blog/startup-ops", 14, 16, "Medium", "fg/default", "LEFT", 580);
    input.x = 44;
    input.y = 24;
    row.appendChild(input);
    var enterIcon = makeTablerIcon("cornerDownLeft", 14, "fg/subtle");
    enterIcon.x = shell.listW - 18;
    enterIcon.y = 24;
    row.appendChild(enterIcon);
    shell.screen.appendChild(row);
  }

  function drawGrid(shell) {
    var x = shell.gridX;
    var y = shell.contentY;
    var colW = 280;
    var gap = 16;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var c = i % 5;
      var r = Math.floor(i / 5);
      var cx = x + c * (colW + gap);
      var cy = y + r * (255 + gap);

      var card = figma.createFrame();
      card.layoutMode = "NONE";
      card.resize(colW, 255);
      card.x = cx;
      card.y = cy;
      card.cornerRadius = 12;
      applyFill(card, "bg/surface");
      applyStroke(card, i === 1 ? "accent/default" : "border/default", i === 1 ? 1.5 : 1);

      var thumb = figma.createFrame();
      thumb.layoutMode = "NONE";
      thumb.resize(colW, 168);
      thumb.cornerRadius = 0;
      thumb.strokes = [];
      if (link.type === "image") applyFill(thumb, "accent/muted");
      else if (link.type === "note") applyFill(thumb, "bg/muted");
      else if (link.type === "document") applyFill(thumb, "warning/muted");
      else applyFill(thumb, "bg/muted");
      card.appendChild(thumb);

      var info = figma.createFrame();
      info.layoutMode = "VERTICAL";
      info.primaryAxisSizingMode = "AUTO";
      info.counterAxisSizingMode = "FIXED";
      info.itemSpacing = 6;
      info.paddingLeft = 12;
      info.paddingRight = 12;
      info.paddingTop = 10;
      info.paddingBottom = 10;
      info.resize(colW, 86);
      info.x = 0;
      info.y = 168;
      info.fills = [];
      info.strokes = [];
      var metaRow = figma.createFrame();
      metaRow.layoutMode = "HORIZONTAL";
      metaRow.primaryAxisAlignItems = "CENTER";
      metaRow.counterAxisAlignItems = "CENTER";
      metaRow.primaryAxisSizingMode = "AUTO";
      metaRow.counterAxisSizingMode = "AUTO";
      metaRow.itemSpacing = 6;
      metaRow.fills = [];
      metaRow.strokes = [];
      if (link.type === "image") {
        metaRow.appendChild(makeTablerIcon("photo", 14, "fg/subtle"));
        metaRow.appendChild(mkText("Image", 12, 16, "Regular", "fg/subtle"));
      } else if (link.type === "document") {
        metaRow.appendChild(makeTablerIcon("fileTypePdf", 14, "fg/subtle"));
        metaRow.appendChild(mkText("Document", 12, 16, "Regular", "fg/subtle"));
      } else if (link.type === "note") {
        metaRow.appendChild(makeTablerIcon("notes", 14, "fg/subtle"));
        metaRow.appendChild(mkText("Note", 12, 16, "Regular", "fg/subtle"));
      } else {
        var small = figma.createFrame();
        small.layoutMode = "NONE";
        small.primaryAxisSizingMode = "FIXED";
        small.counterAxisSizingMode = "FIXED";
        small.resize(14, 14);
        small.cornerRadius = 7;
        applyFill(small, "bg/muted");
        small.strokes = [];
        var initial = mkText(link.domain.charAt(0).toUpperCase(), 8, 8, "Medium", "fg/subtle");
        initial.x = 3;
        initial.y = 3;
        small.appendChild(initial);
        metaRow.appendChild(small);
        metaRow.appendChild(mkText(link.domain, 12, 16, "Regular", "fg/subtle"));
      }
      info.appendChild(metaRow);
      info.appendChild(mkText(link.title, 14, 18, "Medium", "fg/default", "LEFT", colW - 24));
      info.appendChild(mkText(link.created, 12, 16, "Regular", "fg/subtle"));
      card.appendChild(info);

      if (link.pinned) {
        var pinWrap = figma.createFrame();
        pinWrap.layoutMode = "HORIZONTAL";
        pinWrap.primaryAxisAlignItems = "CENTER";
        pinWrap.counterAxisAlignItems = "CENTER";
        pinWrap.primaryAxisSizingMode = "FIXED";
        pinWrap.counterAxisSizingMode = "FIXED";
        pinWrap.resize(20, 20);
        pinWrap.cornerRadius = 10;
        applyFill(pinWrap, "bg/surface");
        pinWrap.opacity = 0.85;
        pinWrap.strokes = [];
        pinWrap.appendChild(makeTablerIcon("pinFilled", 12, "fg/subtle"));
        pinWrap.x = colW - 30;
        pinWrap.y = 10;
        card.appendChild(pinWrap);
      }
      shell.screen.appendChild(card);
    }
  }

  function drawDock(screen, openActions) {
    var dock = figma.createFrame();
    dock.layoutMode = "HORIZONTAL";
    dock.primaryAxisAlignItems = "CENTER";
    dock.counterAxisAlignItems = "CENTER";
    dock.primaryAxisSizingMode = "AUTO";
    dock.counterAxisSizingMode = "AUTO";
    dock.itemSpacing = 8;
    dock.paddingLeft = 8;
    dock.paddingRight = 8;
    dock.paddingTop = 6;
    dock.paddingBottom = 6;
    dock.cornerRadius = 999;
    dock.fills = [{
      type: "GRADIENT_LINEAR",
      gradientStops: [
        { position: 0, color: { r: 0.25, g: 0.25, b: 0.25, a: 0.84 } },
        { position: 1, color: { r: 0.03, g: 0.03, b: 0.03, a: 0.84 } }
      ],
      gradientTransform: [[1, 0, 0], [0, 1, 0]]
    }];
    dock.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.16 }];
    dock.appendChild(mkText("3 selected", 14, 16, "Medium", "overlay/text-primary"));
    dock.appendChild(makeTablerIcon("x", 14, "overlay/text-secondary"));

    var divider = figma.createRectangle();
    divider.resize(1, 18);
    divider.fills = [makePaint("overlay/separator")];
    divider.strokes = [];
    dock.appendChild(divider);

    var delBtn = figma.createFrame();
    delBtn.layoutMode = "HORIZONTAL";
    delBtn.primaryAxisAlignItems = "CENTER";
    delBtn.counterAxisAlignItems = "CENTER";
    delBtn.primaryAxisSizingMode = "AUTO";
    delBtn.counterAxisSizingMode = "AUTO";
    delBtn.itemSpacing = 6;
    delBtn.paddingLeft = 10;
    delBtn.paddingRight = 10;
    delBtn.paddingTop = 6;
    delBtn.paddingBottom = 6;
    delBtn.cornerRadius = 999;
    applyFill(delBtn, "destructive/muted");
    delBtn.strokes = [];
    delBtn.appendChild(makeTablerIcon("trash", 14, "destructive/default"));
    delBtn.appendChild(mkText("Delete", 14, 16, "Medium", "destructive/default"));
    dock.appendChild(delBtn);

    var actions = figma.createFrame();
    actions.name = "Anchor / Dock Actions";
    actions.layoutMode = "HORIZONTAL";
    actions.primaryAxisAlignItems = "CENTER";
    actions.counterAxisAlignItems = "CENTER";
    actions.primaryAxisSizingMode = "AUTO";
    actions.counterAxisSizingMode = "AUTO";
    actions.itemSpacing = 6;
    actions.paddingLeft = 10;
    actions.paddingRight = 10;
    actions.paddingTop = 6;
    actions.paddingBottom = 6;
    actions.cornerRadius = 999;
    applyFill(actions, "bg/muted");
    actions.strokes = [];
    actions.appendChild(makeTablerIcon("dots", 14, "overlay/text-secondary"));
    actions.appendChild(mkText("Actions", 14, 16, "Medium", "overlay/text-primary"));
    dock.appendChild(actions);
    screen.appendChild(dock);
    dock.x = Math.round((SCREEN_W - dock.width) / 2);
    dock.y = SCREEN_H - 76;

    if (openActions) {
      var menu = makeSurfaceMenu(220);
      addMenuItem(menu, "Copy links", false, "copy");
      addMenuItem(menu, "Move to Space", false, "capsule", ">");
      addMenuDivider(menu);
      addMenuItem(menu, "Pin Selected", false, "pin");
      addMenuItem(menu, "Unpin Selected", false, "pinnedOff");
      menu.x = dock.x + dock.width - 70;
      menu.y = dock.y - menu.height - 12;
      screen.appendChild(menu);
    }
  }

  function drawToasts(screen) {
    function toastCard(msg, tone, idx) {
      var t = figma.createFrame();
      t.layoutMode = "HORIZONTAL";
      t.primaryAxisAlignItems = "CENTER";
      t.counterAxisAlignItems = "CENTER";
      t.primaryAxisSizingMode = "FIXED";
      t.counterAxisSizingMode = "AUTO";
      t.itemSpacing = 8;
      t.paddingLeft = 12;
      t.paddingRight = 12;
      t.paddingTop = 10;
      t.paddingBottom = 10;
      t.resize(420, 10);
      t.cornerRadius = 14;
      t.fills = [{
        type: "GRADIENT_LINEAR",
        gradientStops: [
          { position: 0, color: { r: 0.25, g: 0.25, b: 0.25, a: 0.9 } },
          { position: 1, color: { r: 0.03, g: 0.03, b: 0.03, a: 0.9 } }
        ],
        gradientTransform: [[1, 0, 0], [0, 1, 0]]
      }];
      t.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.16 }];
      t.appendChild(makeTablerIcon(
        tone === "success" ? "circleCheck" : tone === "warning" ? "restore" : tone === "error" ? "trash" : "dots",
        14,
        tone === "success" ? "success/default" : tone === "warning" ? "warning/default" : tone === "error" ? "destructive/default" : "overlay/text-secondary"
      ));
      t.appendChild(mkText(msg, 13, 18, "Regular", "overlay/text-primary", "LEFT", 372));
      t.x = Math.round((SCREEN_W - 420) / 2);
      t.y = SCREEN_H - 56 - (idx * 58);
      return t;
    }
    screen.appendChild(toastCard("Link moved to trash", "success", 0));
    screen.appendChild(toastCard("All done · 3 items saved · 1 already saved", "info", 1));
    screen.appendChild(toastCard("Some invalid items were skipped", "warning", 2));
    screen.appendChild(toastCard("Failed to upload documents", "error", 3));
  }

  function makeMenuSwitch(on) {
    var sw = figma.createFrame();
    sw.layoutMode = "NONE";
    sw.primaryAxisSizingMode = "FIXED";
    sw.counterAxisSizingMode = "FIXED";
    sw.resize(34, 20);
    sw.cornerRadius = 999;
    if (on) applyFill(sw, "accent/default");
    else applyFill(sw, "bg/muted");
    sw.strokes = [];

    var thumb = figma.createFrame();
    thumb.layoutMode = "NONE";
    thumb.primaryAxisSizingMode = "FIXED";
    thumb.counterAxisSizingMode = "FIXED";
    thumb.resize(16, 16);
    thumb.cornerRadius = 999;
    applyFill(thumb, "bg/surface");
    thumb.strokes = [];
    thumb.x = on ? 16 : 2;
    thumb.y = 2;
    sw.appendChild(thumb);
    return sw;
  }

  function addUserMenuItem(menu, label, iconName, opts) {
    var item = figma.createFrame();
    item.layoutMode = "HORIZONTAL";
    item.primaryAxisAlignItems = "CENTER";
    item.counterAxisAlignItems = "CENTER";
    item.primaryAxisSizingMode = "FIXED";
    item.counterAxisSizingMode = "FIXED";
    item.itemSpacing = 8;
    item.paddingLeft = 8;
    item.paddingRight = 8;
    item.resize(menu.width - 12, 32);
    item.cornerRadius = 8;
    item.fills = [];
    item.strokes = [];

    var left = figma.createFrame();
    left.layoutMode = "HORIZONTAL";
    left.primaryAxisAlignItems = "CENTER";
    left.counterAxisAlignItems = "CENTER";
    left.primaryAxisSizingMode = "AUTO";
    left.counterAxisSizingMode = "AUTO";
    left.itemSpacing = 8;
    left.fills = [];
    left.strokes = [];
    left.appendChild(makeTablerIcon(iconName, 14, "overlay/text-secondary"));
    left.appendChild(mkText(label, 14, 20, "Medium", "overlay/text-primary"));
    item.appendChild(left);

    var spacer = figma.createFrame();
    spacer.resize(8, 1);
    spacer.fills = [];
    spacer.strokes = [];
    item.appendChild(spacer);

    if (opts && opts.kbd) item.appendChild(mkText(opts.kbd, 11, 16, "Medium", "overlay/text-secondary"));
    if (opts && opts.external) item.appendChild(makeTablerIcon("externalLink", 14, "overlay/text-secondary"));
    if (opts && opts.switchOn !== undefined) item.appendChild(makeMenuSwitch(!!opts.switchOn));
    if (opts && opts.destructive) {
      tintIcon(left, "destructive/default");
      if (item.children.length > 2) {
        for (var ri = 2; ri < item.children.length; ri++) {
          if ("fills" in item.children[ri]) tintIcon(item.children[ri], "destructive/default");
        }
      }
    }

    menu.appendChild(item);
  }

  function addCommandRow(parent, label, iconName, shortcut, current, selected) {
    var row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisAlignItems = "CENTER";
    row.counterAxisAlignItems = "CENTER";
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "FIXED";
    row.itemSpacing = 8;
    row.paddingLeft = 8;
    row.paddingRight = 8;
    row.resize(parent.width - 16, 32);
    row.cornerRadius = 6;
    if (selected) applyFill(row, "bg/selected"); else row.fills = [];
    row.strokes = [];
    row.appendChild(makeTablerIcon(iconName, 14, "fg/subtle"));
    row.appendChild(mkText(label, 13, 18, "Medium", "fg/default"));

    var sp = figma.createFrame();
    sp.resize(8, 1);
    sp.fills = [];
    sp.strokes = [];
    row.appendChild(sp);

    if (current) {
      row.appendChild(mkText("Current", 11, 16, "Medium", "fg/subtle"));
    } else if (shortcut) {
      row.appendChild(mkText(shortcut, 11, 16, "Medium", "fg/subtle"));
    }
    parent.appendChild(row);
  }

  function addCommandGroup(parent, heading, rows) {
    var grp = figma.createFrame();
    grp.layoutMode = "VERTICAL";
    grp.primaryAxisSizingMode = "AUTO";
    grp.counterAxisSizingMode = "FIXED";
    grp.itemSpacing = 4;
    grp.paddingLeft = 4;
    grp.paddingRight = 4;
    grp.paddingTop = 4;
    grp.paddingBottom = 4;
    grp.resize(parent.width, 10);
    grp.fills = [];
    grp.strokes = [];

    grp.appendChild(mkText(heading, 12, 16, "Medium", "fg/subtle"));
    for (var i = 0; i < rows.length; i++) {
      addCommandRow(grp, rows[i].label, rows[i].icon, rows[i].shortcut, !!rows[i].current, !!rows[i].selected);
    }
    parent.appendChild(grp);
  }

  function addBottomFade(screen) {
    var f = figma.createRectangle();
    f.resize(SCREEN_W, 96);
    f.x = 0;
    f.y = SCREEN_H - 96;
    f.fills = [{
      type: "GRADIENT_LINEAR",
      gradientStops: [
        { position: 0, color: { r: 0.98, g: 0.98, b: 0.98, a: 0 } },
        { position: 1, color: { r: 0.98, g: 0.98, b: 0.98, a: 1 } }
      ],
      gradientTransform: [[1, 0, 0], [0, 1, 0]]
    }];
    f.strokes = [];
    screen.appendChild(f);
  }

  function makeListDefault() {
    var shell = makeHomeShell("Home / List / Default", { title: "All", viewMode: "list" });
    drawListRows(shell, {});
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeGridDefault() {
    var shell = makeHomeShell("Home / Grid / Default", { title: "All", viewMode: "grid" });
    drawGrid(shell);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeInlineAddState() {
    var shell = makeHomeShell("Home / List / Inline Add", { title: "All", viewMode: "list" });
    drawInlineAdd(shell);
    var rows = drawListRows(shell, {});
    for (var i = 0; i < rows.rows.length; i++) rows.rows[i].y += 72;
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeAddMenuState() {
    var shell = makeHomeShell("Home / Menus / Add Menu", { title: "All", viewMode: "list" });
    drawListRows(shell, {});
    var menu = makeSurfaceMenu(176);
    addMenuItem(menu, "Link", false, "plus");
    addMenuItem(menu, "Upload", false, "upload");
    addMenuItem(menu, "Color", false, "palette");
    addMenuItem(menu, "Note", false, "notes");
    addMenuItem(menu, "Space", false, "folder");
    menu.x = shell.addAnchor.x;
    menu.y = shell.addAnchor.y + 42;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeOptionsMenuState() {
    var shell = makeHomeShell("Home / Menus / Options Menu", { title: "All", viewMode: "list" });
    drawListRows(shell, {});
    var menu = makeSurfaceMenu(224);
    addMenuItem(menu, "List view", false, "layoutList");
    addMenuItem(menu, "Grid view", false, "layoutGrid");
    addMenuDivider(menu);
    addMenuItem(menu, "Date Added", false, "circleCheck", "↓");
    addMenuItem(menu, "Name", false, null);
    menu.x = shell.optionsAnchor.x - 172;
    menu.y = shell.optionsAnchor.y + 42;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeViewMenuState() {
    var shell = makeHomeShell("Home / Menus / View Switcher", { title: "Product", viewMode: "list" });
    drawListRows(shell, {});
    var menu = makeSurfaceMenu(236);
    addMenuItem(menu, "All", false, "capsule", "1");
    for (var i = 0; i < spaces.length; i++) {
      addMenuItem(menu, spaces[i].name, false, "capsule", String(i + 2), spaces[i].color);
    }
    addMenuDivider(menu);
    addMenuItem(menu, "Create Space", false, "plus");
    menu.x = shell.viewAnchor.x + 20;
    menu.y = shell.viewAnchor.y + 48;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeContextSingleState() {
    var shell = makeHomeShell("Home / Menus / Context Single", { title: "All", viewMode: "list" });
    var rows = drawListRows(shell, {});
    var target = rows.rows[3];
    target.fills = [makePaint("bg/hover")];
    var menu = makeSurfaceMenu(228);
    addMenuItem(menu, "Copy URL", false, "copy", "⌘C");
    addMenuItem(menu, "Rename", false, "pencil");
    addMenuItem(menu, "Pin", false, "pin");
    addMenuDivider(menu);
    addMenuItem(menu, "Move to Space", false, "capsule", ">");
    addMenuDivider(menu);
    addMenuItem(menu, "Delete", true, "trash", "⌘⌫");
    menu.x = shell.listX + 500;
    menu.y = target.y + 10;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeContextBatchState() {
    var shell = makeHomeShell("Home / Menus / Context Batch", { title: "All", viewMode: "list" });
    var rows = drawListRows(shell, { selectedRows: [2, 3, 4] });
    var menu = makeSurfaceMenu(228);
    addMenuItem(menu, "Pin 3 items", false, "pin");
    addMenuItem(menu, "Unpin 3 items", false, "pinnedOff");
    addMenuDivider(menu);
    addMenuItem(menu, "Delete 3 items", true, "trash");
    menu.x = shell.listX + 520;
    menu.y = rows.rows[4].y + 8;
    shell.screen.appendChild(menu);
    drawDock(shell.screen, true);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeTrashState() {
    var shell = makeHomeShell("Home / Menus / Trash Context", {
      title: "Trash",
      isTrash: true,
      viewMode: "list",
      warning: "You've reached the 100-item limit. Upgrade to Pro to keep saving.",
      warningType: "danger"
    });
    var rows = drawListRows(shell, {});
    var menu = makeSurfaceMenu(228);
    addMenuItem(menu, "Open", false, "externalLink");
    addMenuItem(menu, "Copy URL", false, "copy");
    addMenuDivider(menu);
    addMenuItem(menu, "Restore", false, "restore");
    addMenuDivider(menu);
    addMenuItem(menu, "Delete permanently", true, "trash");
    menu.x = shell.listX + 520;
    menu.y = rows.rows[2].y + 8;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeToastsState() {
    var shell = makeHomeShell("Home / Feedback / Toast Stack", { title: "All", viewMode: "list", search: "startup" });
    drawListRows(shell, {});
    drawToasts(shell.screen);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeEmptyState() {
    var shell = makeHomeShell("Home / Feedback / Empty", { title: "All", viewMode: "list" });
    var wrap = figma.createFrame();
    wrap.layoutMode = "VERTICAL";
    wrap.primaryAxisAlignItems = "CENTER";
    wrap.counterAxisAlignItems = "CENTER";
    wrap.primaryAxisSizingMode = "AUTO";
    wrap.counterAxisSizingMode = "AUTO";
    wrap.itemSpacing = 12;
    wrap.fills = [];
    wrap.strokes = [];
    wrap.appendChild(makeTablerIcon("linkChain", 48, "fg/subtle"));
    wrap.appendChild(mkText("No links yet", 14, 20, "Medium", "fg/default"));
    shell.screen.appendChild(wrap);
    wrap.x = Math.round((SCREEN_W - wrap.width) / 2);
    wrap.y = shell.contentY + 180;
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeDragDropState() {
    var shell = makeHomeShell("Home / Feedback / Drag Drop Overlay", { title: "All", viewMode: "list" });
    drawListRows(shell, {});
    var scrim = figma.createRectangle();
    scrim.resize(SCREEN_W, SCREEN_H);
    scrim.x = 0;
    scrim.y = 0;
    scrim.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 }, opacity: 0.8 }];
    scrim.strokes = [];
    shell.screen.appendChild(scrim);

    var modal = figma.createFrame();
    modal.layoutMode = "VERTICAL";
    modal.primaryAxisAlignItems = "CENTER";
    modal.counterAxisAlignItems = "CENTER";
    modal.primaryAxisSizingMode = "AUTO";
    modal.counterAxisSizingMode = "AUTO";
    modal.itemSpacing = 12;
    modal.paddingLeft = 36;
    modal.paddingRight = 36;
    modal.paddingTop = 28;
    modal.paddingBottom = 28;
    modal.cornerRadius = 16;
    applyFill(modal, "bg/surface");
    modal.strokes = [makePaint("accent/default")];
    modal.appendChild(makeTablerIcon("upload", 32, "accent/default"));
    modal.appendChild(mkText("Drop a PDF or image to upload", 18, 24, "Medium", "fg/default"));
    shell.screen.appendChild(modal);
    modal.x = Math.round((SCREEN_W - modal.width) / 2);
    modal.y = Math.round((SCREEN_H - modal.height) / 2);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeUserMenuState(switchOn) {
    var shell = makeHomeShell("Home / Menus / User Menu / " + (switchOn ? "Dark On" : "Dark Off"), { title: "All", viewMode: "list" });
    drawListRows(shell, {});
    var menu = makeSurfaceMenu(256);

    var id = figma.createFrame();
    id.layoutMode = "VERTICAL";
    id.primaryAxisSizingMode = "AUTO";
    id.counterAxisSizingMode = "FIXED";
    id.itemSpacing = 2;
    id.paddingLeft = 8;
    id.paddingRight = 8;
    id.paddingTop = 4;
    id.paddingBottom = 4;
    id.resize(menu.width - 12, 44);
    id.fills = [];
    id.strokes = [];
    id.appendChild(mkText("Hassan", 14, 20, "Medium", "overlay/text-primary"));
    id.appendChild(mkText("hassan@cadie.app", 12, 16, "Regular", "overlay/text-secondary"));
    menu.appendChild(id);
    addMenuDivider(menu);
    addUserMenuItem(menu, "Beta Feedback", "message", { external: true });
    addUserMenuItem(menu, "Settings", "settings", { kbd: "," });
    addMenuDivider(menu);
    addUserMenuItem(menu, "Dark mode", "moon", { switchOn: !!switchOn });
    addMenuDivider(menu);
    addUserMenuItem(menu, "Changelog", "ship", { external: true });
    addUserMenuItem(menu, "Follow us on X", "brandX", { external: true });
    addUserMenuItem(menu, "Keyboard Shortcuts", "keyboard", { kbd: "CMD/" });
    addMenuDivider(menu);
    addUserMenuItem(menu, "Log out", "logout", {});
    menu.x = SCREEN_W - menu.width - 28;
    menu.y = 58;
    shell.screen.appendChild(menu);
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeCommandMenuDefaultState() {
    var shell = makeHomeShell("Home / Menus / Command Menu / Default", { title: "All", viewMode: "list" });
    drawListRows(shell, {});

    var dialog = figma.createFrame();
    dialog.layoutMode = "VERTICAL";
    dialog.primaryAxisSizingMode = "AUTO";
    dialog.counterAxisSizingMode = "FIXED";
    dialog.itemSpacing = 0;
    dialog.resize(560, 10);
    dialog.cornerRadius = 14;
    applyFill(dialog, "bg/surface");
    applyStroke(dialog, "border/default", 1);

    var input = figma.createFrame();
    input.layoutMode = "HORIZONTAL";
    input.primaryAxisAlignItems = "CENTER";
    input.counterAxisAlignItems = "CENTER";
    input.primaryAxisSizingMode = "FIXED";
    input.counterAxisSizingMode = "FIXED";
    input.itemSpacing = 8;
    input.paddingLeft = 12;
    input.paddingRight = 12;
    input.resize(560, 44);
    input.fills = [];
    input.strokes = [];
    input.appendChild(makeTablerIcon("search", 14, "fg/subtle"));
    input.appendChild(mkText("Type to search links, colors, files, or run actions...", 13, 18, "Regular", "fg/subtle"));
    dialog.appendChild(input);

    var sep1 = figma.createRectangle();
    sep1.resize(560, 1);
    sep1.fills = [makePaint("border/default")];
    sep1.strokes = [];
    dialog.appendChild(sep1);

    var list = figma.createFrame();
    list.layoutMode = "VERTICAL";
    list.primaryAxisSizingMode = "AUTO";
    list.counterAxisSizingMode = "FIXED";
    list.itemSpacing = 6;
    list.paddingLeft = 8;
    list.paddingRight = 8;
    list.paddingTop = 8;
    list.paddingBottom = 8;
    list.resize(560, 10);
    list.fills = [];
    list.strokes = [];

    addCommandGroup(list, "Create", [
      { icon: "plus", label: "Link", shortcut: "N" },
      { icon: "upload", label: "Upload" },
      { icon: "palette", label: "Color" },
      { icon: "notes", label: "Note" },
      { icon: "folder", label: "Space" }
    ]);
    var sA = figma.createRectangle(); sA.resize(544, 1); sA.fills = [makePaint("border/default")]; sA.strokes = []; list.appendChild(sA);

    addCommandGroup(list, "General", [
      { icon: "layoutGrid", label: "Toggle grid view", shortcut: "V" },
      { icon: "help", label: "Show keyboard shortcuts", shortcut: "CMD/" }
    ]);
    var sB = figma.createRectangle(); sB.resize(544, 1); sB.fills = [makePaint("border/default")]; sB.strokes = []; list.appendChild(sB);

    addCommandGroup(list, "Sort", [
      { icon: "arrowsSort", label: "Sort by date" },
      { icon: "arrowsSort", label: "Sort by name" }
    ]);
    var sC = figma.createRectangle(); sC.resize(544, 1); sC.fills = [makePaint("border/default")]; sC.strokes = []; list.appendChild(sC);

    addCommandGroup(list, "Navigate", [
      { icon: "folder", label: "Go to All items", current: true },
      { icon: "trash", label: "Go to Trash" },
      { icon: "folder", label: "Go to Product" }
    ]);

    dialog.appendChild(list);
    shell.screen.appendChild(dialog);
    dialog.x = Math.round((SCREEN_W - dialog.width) / 2);
    dialog.y = 158;
    addBottomFade(shell.screen);
    return shell.screen;
  }

  function makeCommandMenuSearchState() {
    var shell = makeHomeShell("Home / Menus / Command Menu / Query", { title: "All", viewMode: "list", search: "startup" });
    drawListRows(shell, {});

    var dialog = figma.createFrame();
    dialog.layoutMode = "VERTICAL";
    dialog.primaryAxisSizingMode = "AUTO";
    dialog.counterAxisSizingMode = "FIXED";
    dialog.itemSpacing = 0;
    dialog.resize(560, 10);
    dialog.cornerRadius = 14;
    applyFill(dialog, "bg/surface");
    applyStroke(dialog, "border/default", 1);

    var input = figma.createFrame();
    input.layoutMode = "HORIZONTAL";
    input.primaryAxisAlignItems = "CENTER";
    input.counterAxisAlignItems = "CENTER";
    input.primaryAxisSizingMode = "FIXED";
    input.counterAxisSizingMode = "FIXED";
    input.itemSpacing = 8;
    input.paddingLeft = 12;
    input.paddingRight = 12;
    input.resize(560, 44);
    input.fills = [];
    input.strokes = [];
    input.appendChild(makeTablerIcon("search", 14, "fg/subtle"));
    input.appendChild(mkText("startup", 13, 18, "Regular", "fg/default"));
    dialog.appendChild(input);

    var sep1 = figma.createRectangle();
    sep1.resize(560, 1);
    sep1.fills = [makePaint("border/default")];
    sep1.strokes = [];
    dialog.appendChild(sep1);

    var list = figma.createFrame();
    list.layoutMode = "VERTICAL";
    list.primaryAxisSizingMode = "AUTO";
    list.counterAxisSizingMode = "FIXED";
    list.itemSpacing = 6;
    list.paddingLeft = 8;
    list.paddingRight = 8;
    list.paddingTop = 8;
    list.paddingBottom = 8;
    list.resize(560, 10);
    list.fills = [];
    list.strokes = [];

    addCommandGroup(list, "Search", [
      { icon: "search", label: 'Search for "startup"', shortcut: "ENTER", selected: true }
    ]);
    var sA = figma.createRectangle(); sA.resize(544, 1); sA.fills = [makePaint("border/default")]; sA.strokes = []; list.appendChild(sA);
    addCommandGroup(list, "Create", [
      { icon: "plus", label: "Link", shortcut: "N" }
    ]);

    dialog.appendChild(list);
    shell.screen.appendChild(dialog);
    dialog.x = Math.round((SCREEN_W - dialog.width) / 2);
    dialog.y = 158;
    addBottomFade(shell.screen);
    return shell.screen;
  }

  var existing = figma.currentPage.findAll(function(n) {
    return n.type === "FRAME" && n.name.indexOf("Cadie / Home / Mirror /") === 0;
  });
  for (var ei = 0; ei < existing.length; ei++) existing[ei].remove();

  var startY = 0;
  for (var ci = 0; ci < figma.currentPage.children.length; ci++) {
    var bottom = figma.currentPage.children[ci].y + figma.currentPage.children[ci].height;
    if (bottom > startY) startY = bottom;
  }
  startY += 120;

  var screens = [
    makeListDefault(),
    makeGridDefault(),
    makeInlineAddState(),
    makeAddMenuState(),
    makeOptionsMenuState(),
    makeViewMenuState(),
    makeContextSingleState(),
    makeContextBatchState(),
    makeTrashState(),
    makeUserMenuState(false),
    makeUserMenuState(true),
    makeCommandMenuDefaultState(),
    makeCommandMenuSearchState(),
    makeToastsState(),
    makeEmptyState(),
    makeDragDropState()
  ];

  var cols = 3;
  var gapX = 120;
  var gapY = 140;
  var all = [];
  for (var i = 0; i < screens.length; i++) {
    var c = i % cols;
    var r = Math.floor(i / cols);
    screens[i].name = "Cadie / Home / Mirror / " + screens[i].name;
    screens[i].x = c * (SCREEN_W + gapX);
    screens[i].y = startY + r * (SCREEN_H + gapY);
    figma.currentPage.appendChild(screens[i]);
    all.push(screens[i]);
  }

  figma.viewport.scrollAndZoomIntoView(all);
  figma.notify("✅  Created Home mirror screens (Phase 1-4): list/grid, menu states, user menu, command menu, and feedback states.");
  figma.closePlugin();
}

// ─── Command: Create Settings Mirror Screens ─────────────────────────────────

async function createSettingsMirrorScreens() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(function() {});
  await figma.loadFontAsync({ family: "Inter", style: "Bold" }).catch(function() {});

  var colorVars = figma.variables.getLocalVariables("COLOR");
  function getVar(name) { return colorVars.find(function(v) { return v.name === name; }) || null; }
  function makePaint(varName) {
    var base = { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 }, opacity: 1 };
    if (!varName) return base;
    var variable = getVar(varName);
    if (!variable) return base;
    return figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } },
      "color",
      variable
    );
  }
  function applyFill(node, varName) { node.fills = varName ? [makePaint(varName)] : []; }
  function applyStroke(node, varName, weight) {
    if (!varName) { node.strokes = []; return; }
    node.strokes = [makePaint(varName)];
    node.strokeWeight = weight || 1;
    node.strokeAlign = "INSIDE";
  }
  function mkText(chars, fs, lh, weight, colorVar, align, width) {
    var t = figma.createText();
    t.fontName = { family: "Inter", style: weight || "Regular" };
    t.fontSize = fs;
    t.lineHeight = { unit: "PIXELS", value: lh };
    t.characters = chars;
    if (width) {
      t.textAutoResize = "HEIGHT";
      t.resize(width, 10);
      t.textAlignHorizontal = align || "LEFT";
    } else {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
    }
    applyFill(t, colorVar || "fg/default");
    return t;
  }

  var ICONS = {
    userFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z"/><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z"/></svg>',
    capsuleFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 5h-6a7 7 0 1 0 0 14h6a7 7 0 0 0 7 -7l-.007 -.303a7 7 0 0 0 -6.993 -6.697z"/></svg>',
    creditCardFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 10v6a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-6h20zm-14.99 4h-.01a1 1 0 1 0 .01 2a1 1 0 0 0 0 -2zm5.99 0h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0 -2zm5 -10a4 4 0 0 1 4 4h-20a4 4 0 0 1 4 -4h12z"/></svg>',
    paletteFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2c5.498 0 10 4.002 10 9c0 1.351 -.6 2.64 -1.654 3.576c-1.03 .914 -2.412 1.424 -3.846 1.424h-2.516a1 1 0 0 0 -.5 1.875a1 1 0 0 1 .194 .14a2.3 2.3 0 0 1 -1.597 3.99l-.273 -.004c-5.3 -.146 -9.57 -4.416 -9.716 -9.716l-.004 -.28c0 -5.523 4.477 -10 10 -10m-3.5 6.5a2 2 0 1 0 0 4a2 2 0 0 0 0 -4m8 0a2 2 0 1 0 0 4a2 2 0 0 0 0 -4m-4 -3a2 2 0 1 0 0 4a2 2 0 0 0 0 -4"/></svg>',
    puzzleFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 2a3 3 0 0 1 2.995 2.824l.005 .176v1h3a2 2 0 0 1 1.995 1.85l.005 .15v3h1a3 3 0 0 1 .176 5.995l-.176 .005h-1v3a2 2 0 0 1 -1.85 1.995l-.15 .005h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-1a1 1 0 0 0 -1.993 -.117l-.007 .117v1a2 2 0 0 1 -1.85 1.995l-.15 .005h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 1.85 -1.995l.15 -.005h1a1 1 0 0 0 .117 -1.993l-.117 -.007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 1.85 -1.995l.15 -.005h3v-1a3 3 0 0 1 3 -3z"/></svg>',
    exchangeFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 3a3 3 0 0 1 1 5.83v4.17a6 6 0 0 1 -6 6h-.585l1.292 1.293a1 1 0 0 1 .083 1.32l-.083 .094a1 1 0 0 1 -1.414 0l-2.959 -2.959a1 1 0 0 1 -.266 -.505a.98 .98 0 0 1 .187 -.866l.076 -.084l3 -3a1 1 0 0 1 1.414 1.414l-1.293 1.293h.586a4 4 0 0 0 4 -4v-4.171a3 3 0 0 1 -2 -2.829l.005 -.176a3 3 0 0 1 2.995 -2.824m-8.293 -.707l3 3a.98 .98 0 0 1 .263 .95a1 1 0 0 1 -.232 .417l-2.965 2.963a1 1 0 0 1 -1.414 -1.414l1.291 -1.293h-.584a4 4 0 0 0 -4 4v4.171a3.001 3.001 0 1 1 -4 2.829l.005 -.176a3 3 0 0 1 1.995 -2.654v-4.17a6 6 0 0 1 6 -6h.585l-1.292 -1.293a1 1 0 0 1 1.414 -1.414"/></svg>',
    infoCircleFilled: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -19.995 .324l-.005 -.324a10 10 0 0 1 10 -10zm0 9h-1a1 1 0 0 0 0 2v3a1 1 0 0 0 2 0v-4a1 1 0 0 0 -1 -1zm.01 -3a1 1 0 1 0 0 2a1 1 0 0 0 0 -2z"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>',
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>',
    lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/></svg>',
    loader2: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
    upload: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 9l5 -5l5 5"/><path d="M12 4l0 12"/></svg>',
    circleCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 12l2 2l4 -4"/></svg>',
    alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    fileExport: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3"/></svg>',
    mail: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"/><path d="M3 7l9 6l9 -6"/></svg>',
    arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 8v-2a2 2 0 0 0 -2 -2h-5a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h5a2 2 0 0 0 2 -2v-2"/><path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/></svg>',
    brandX: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#111111"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.578 2l2.46 3.735l2.088 3.173l1.136 1.727l6.738 10.365h-6.123l-4.388 -6.73l-.734 -1.126l-4.736 7.856h-5.896l7.126 -11.816l.422 -.698l-6.671 -10.186h6.113l4.127 6.3l.718 1.095l.014 -.024l1.681 -2.786l2.08 -3.585h5.865l-6.73 11.187l-.461 .767z"/></svg>'
  };

  function tintIcon(node, varName) {
    function tintPaints(paints) {
      if (!Array.isArray(paints)) return paints;
      var out = [];
      for (var i = 0; i < paints.length; i++) {
        var p = paints[i];
        if (p.type !== "SOLID") { out.push(p); continue; }
        var np = { type: "SOLID", color: { r: 0.07, g: 0.07, b: 0.07 }, opacity: p.opacity == null ? 1 : p.opacity };
        var variable = getVar(varName);
        if (variable) out.push(figma.variables.setBoundVariableForPaint(np, "color", variable));
        else out.push(np);
      }
      return out;
    }
    if ("fills" in node && node.fills !== figma.mixed) { try { node.fills = tintPaints(node.fills); } catch (_) {} }
    if ("strokes" in node && node.strokes !== figma.mixed) { try { node.strokes = tintPaints(node.strokes); } catch (_) {} }
    if ("children" in node && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) tintIcon(node.children[i], varName);
    }
  }

  function makeIcon(name, size, colorVar) {
    var svg = ICONS[name] || ICONS.plus;
    var node = figma.createNodeFromSvg(svg);
    tintIcon(node, colorVar || "fg/default");
    node.resize(size, size);
    return node;
  }

  var SCREEN_W = 1200;
  var SCREEN_H = 840;
  var MODAL_W = 900;
  var MODAL_H = 640;
  var SIDEBAR_W = 220;
  var CONTENT_W = MODAL_W - SIDEBAR_W;

  var NAV_ITEMS = [
    { id: "profile", name: "Profile", icon: "userFilled" },
    { id: "spaces", name: "Spaces", icon: "capsuleFilled" },
    { id: "billing", name: "Billing", icon: "creditCardFilled" },
    { id: "appearance", name: "Appearance", icon: "paletteFilled" },
    { id: "extensions", name: "Extensions", icon: "puzzleFilled" },
    { id: "data", name: "Data", icon: "exchangeFilled" },
    { id: "about", name: "About", icon: "infoCircleFilled" }
  ];

  function makeRowButton(label, icon, active, w) {
    var b = figma.createFrame();
    b.layoutMode = "HORIZONTAL";
    b.primaryAxisAlignItems = "CENTER";
    b.counterAxisAlignItems = "CENTER";
    b.primaryAxisSizingMode = "FIXED";
    b.counterAxisSizingMode = "FIXED";
    b.itemSpacing = 10;
    b.paddingLeft = 10;
    b.paddingRight = 10;
    b.resize(w, 36);
    b.cornerRadius = 8;
    if (active) applyFill(b, "bg/selected");
    else b.fills = [];
    b.strokes = [];
    b.appendChild(makeIcon(icon, 18, "fg/default"));
    b.appendChild(mkText(label, 14, 20, "Regular", "fg/default"));
    return b;
  }

  function makeInputRow(label, value, disabled, width, buttonText) {
    var wrap = figma.createFrame();
    wrap.layoutMode = "VERTICAL";
    wrap.primaryAxisSizingMode = "AUTO";
    wrap.counterAxisSizingMode = "FIXED";
    wrap.itemSpacing = 6;
    wrap.resize(width, 10);
    wrap.fills = [];
    wrap.strokes = [];
    wrap.appendChild(mkText(label, 12, 16, "Medium", "fg/subtle"));

    var input = figma.createFrame();
    input.layoutMode = "HORIZONTAL";
    input.primaryAxisAlignItems = "CENTER";
    input.counterAxisAlignItems = "CENTER";
    input.primaryAxisSizingMode = "FIXED";
    input.counterAxisSizingMode = "FIXED";
    input.itemSpacing = 8;
    input.paddingLeft = 10;
    input.paddingRight = 10;
    input.resize(width, 40);
    input.cornerRadius = 8;
    applyFill(input, "bg/input");
    if (disabled) input.opacity = 0.78;
    input.strokes = [];
    input.appendChild(mkText(value, 13, 18, "Regular", "fg/default", "LEFT", width - 40));
    if (buttonText) {
      var btn = figma.createFrame();
      btn.layoutMode = "HORIZONTAL";
      btn.primaryAxisAlignItems = "CENTER";
      btn.counterAxisAlignItems = "CENTER";
      btn.primaryAxisSizingMode = "AUTO";
      btn.counterAxisSizingMode = "AUTO";
      btn.paddingLeft = 10;
      btn.paddingRight = 10;
      btn.paddingTop = 6;
      btn.paddingBottom = 6;
      btn.cornerRadius = 8;
      applyFill(btn, "accent/default");
      btn.strokes = [];
      btn.appendChild(mkText(buttonText, 12, 16, "Medium", "fg/on-accent"));
      input.appendChild(btn);
    }
    wrap.appendChild(input);
    return wrap;
  }

  function makeCard(width, padding) {
    var c = figma.createFrame();
    c.layoutMode = "VERTICAL";
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "FIXED";
    c.itemSpacing = 10;
    c.paddingLeft = padding || 14;
    c.paddingRight = padding || 14;
    c.paddingTop = padding || 14;
    c.paddingBottom = padding || 14;
    c.resize(width, 10);
    c.cornerRadius = 12;
    applyFill(c, "bg/surface");
    applyStroke(c, "border/default", 1);
    return c;
  }

  function addDialogOverlay(modal, title, desc, confirmText, destructive, disabledConfirm) {
    var scrim = figma.createRectangle();
    scrim.resize(MODAL_W, MODAL_H);
    scrim.x = 0;
    scrim.y = 0;
    scrim.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.18 }];
    scrim.strokes = [];
    modal.appendChild(scrim);

    var d = makeCard(460, 16);
    d.itemSpacing = 12;
    d.appendChild(mkText(title, 18, 24, "Semi Bold", "fg/default"));
    d.appendChild(mkText(desc, 13, 18, "Regular", "fg/subtle", "LEFT", 428));

    var actions = figma.createFrame();
    actions.layoutMode = "HORIZONTAL";
    actions.primaryAxisAlignItems = "CENTER";
    actions.counterAxisAlignItems = "CENTER";
    actions.primaryAxisSizingMode = "FIXED";
    actions.counterAxisSizingMode = "AUTO";
    actions.itemSpacing = 8;
    actions.resize(428, 10);
    actions.fills = [];
    actions.strokes = [];

    var cancel = figma.createFrame();
    cancel.layoutMode = "HORIZONTAL";
    cancel.primaryAxisAlignItems = "CENTER";
    cancel.counterAxisAlignItems = "CENTER";
    cancel.primaryAxisSizingMode = "AUTO";
    cancel.counterAxisSizingMode = "AUTO";
    cancel.paddingLeft = 12;
    cancel.paddingRight = 12;
    cancel.paddingTop = 8;
    cancel.paddingBottom = 8;
    cancel.cornerRadius = 8;
    applyFill(cancel, "bg/muted");
    cancel.strokes = [];
    cancel.appendChild(mkText("Cancel", 13, 18, "Medium", "fg/default"));
    actions.appendChild(cancel);

    var spacer = figma.createFrame();
    spacer.resize(250, 1);
    spacer.fills = [];
    spacer.strokes = [];
    actions.appendChild(spacer);

    var confirm = figma.createFrame();
    confirm.layoutMode = "HORIZONTAL";
    confirm.primaryAxisAlignItems = "CENTER";
    confirm.counterAxisAlignItems = "CENTER";
    confirm.primaryAxisSizingMode = "AUTO";
    confirm.counterAxisSizingMode = "AUTO";
    confirm.paddingLeft = 12;
    confirm.paddingRight = 12;
    confirm.paddingTop = 8;
    confirm.paddingBottom = 8;
    confirm.cornerRadius = 8;
    applyFill(confirm, destructive ? "destructive/default" : "accent/default");
    if (disabledConfirm) confirm.opacity = 0.45;
    confirm.strokes = [];
    confirm.appendChild(mkText(confirmText, 13, 18, "Medium", "fg/on-accent"));
    actions.appendChild(confirm);

    d.appendChild(actions);
    modal.appendChild(d);
    d.x = Math.round((MODAL_W - d.width) / 2);
    d.y = Math.round((MODAL_H - d.height) / 2);
  }

  function makeShell(name, activeSection) {
    var screen = figma.createFrame();
    screen.name = name;
    screen.layoutMode = "NONE";
    screen.resize(SCREEN_W, SCREEN_H);
    applyFill(screen, "bg/default");
    screen.strokes = [];

    var modal = figma.createFrame();
    modal.layoutMode = "NONE";
    modal.resize(MODAL_W, MODAL_H);
    modal.cornerRadius = 16;
    applyFill(modal, "bg/elevated");
    applyStroke(modal, "border/default", 1);
    modal.x = Math.round((SCREEN_W - MODAL_W) / 2);
    modal.y = Math.round((SCREEN_H - MODAL_H) / 2);
    screen.appendChild(modal);

    var sidebar = figma.createFrame();
    sidebar.layoutMode = "VERTICAL";
    sidebar.primaryAxisSizingMode = "AUTO";
    sidebar.counterAxisSizingMode = "FIXED";
    sidebar.itemSpacing = 4;
    sidebar.paddingLeft = 12;
    sidebar.paddingRight = 12;
    sidebar.paddingTop = 20;
    sidebar.paddingBottom = 20;
    sidebar.resize(SIDEBAR_W, MODAL_H);
    applyFill(sidebar, "bg/surface");
    sidebar.strokes = [];
    modal.appendChild(sidebar);

    var divider = figma.createRectangle();
    divider.resize(1, MODAL_H);
    divider.x = SIDEBAR_W;
    divider.y = 0;
    divider.fills = [makePaint("border/default")];
    divider.strokes = [];
    modal.appendChild(divider);

    for (var ni = 0; ni < NAV_ITEMS.length; ni++) {
      sidebar.appendChild(makeRowButton(NAV_ITEMS[ni].name, NAV_ITEMS[ni].icon, NAV_ITEMS[ni].id === activeSection, SIDEBAR_W - 24));
    }

    var content = figma.createFrame();
    content.layoutMode = "NONE";
    content.resize(CONTENT_W - 48, MODAL_H - 48);
    content.x = SIDEBAR_W + 24;
    content.y = 24;
    content.fills = [];
    content.strokes = [];
    modal.appendChild(content);

    var title = mkText(NAV_ITEMS.find(function(n) { return n.id === activeSection; }).name, 22, 30, "Semi Bold", "fg/default");
    title.x = 0;
    title.y = 0;
    content.appendChild(title);

    return {
      screen: screen,
      modal: modal,
      content: content,
      bodyX: 0,
      bodyY: 44,
      bodyW: content.width,
      bodyH: content.height - 44
    };
  }

  function drawProfile(content, state) {
    var avatarWrap = figma.createFrame();
    avatarWrap.layoutMode = "HORIZONTAL";
    avatarWrap.primaryAxisAlignItems = "CENTER";
    avatarWrap.counterAxisAlignItems = "CENTER";
    avatarWrap.primaryAxisSizingMode = "AUTO";
    avatarWrap.counterAxisSizingMode = "AUTO";
    avatarWrap.itemSpacing = 14;
    avatarWrap.fills = [];
    avatarWrap.strokes = [];
    content.appendChild(avatarWrap);
    avatarWrap.x = 0;
    avatarWrap.y = 48;

    var av = figma.createFrame();
    av.layoutMode = "NONE";
    av.resize(92, 92);
    av.cornerRadius = 46;
    applyFill(av, "accent/default");
    av.strokes = [];
    av.appendChild(mkText("H", 34, 38, "Semi Bold", "fg/on-accent"));
    av.children[0].x = 29;
    av.children[0].y = 27;
    var editBtn = figma.createFrame();
    editBtn.layoutMode = "HORIZONTAL";
    editBtn.primaryAxisAlignItems = "CENTER";
    editBtn.counterAxisAlignItems = "CENTER";
    editBtn.primaryAxisSizingMode = "FIXED";
    editBtn.counterAxisSizingMode = "FIXED";
    editBtn.resize(28, 28);
    editBtn.cornerRadius = 14;
    applyFill(editBtn, "bg/surface");
    applyStroke(editBtn, "border/default", 1);
    if (state === "uploading") editBtn.appendChild(makeIcon("loader2", 14, "fg/subtle"));
    else editBtn.appendChild(makeIcon("pencil", 14, "fg/subtle"));
    editBtn.x = 64;
    editBtn.y = 64;
    av.appendChild(editBtn);
    avatarWrap.appendChild(av);
    avatarWrap.appendChild(mkText("Profile Photo", 14, 20, "Medium", "fg/default"));

    var nameRow = makeInputRow("Your name", "Hassan", false, content.width, state === "saving" ? "Updating" : "Update");
    nameRow.x = 0;
    nameRow.y = 168;
    content.appendChild(nameRow);
    if (state === "saving") {
      var updateBtn = nameRow.children[1].children[nameRow.children[1].children.length - 1];
      updateBtn.insertChild(0, makeIcon("loader2", 12, "fg/on-accent"));
      updateBtn.itemSpacing = 6;
    }

    var emailRow = makeInputRow("Email Address", "hassan@cadie.app", true, content.width, null);
    emailRow.x = 0;
    emailRow.y = 248;
    content.appendChild(emailRow);
    var help = mkText("Your email address is managed via your login provider.", 11, 16, "Regular", "fg/subtle");
    help.x = 0;
    help.y = 324;
    content.appendChild(help);

    var signOut = figma.createFrame();
    signOut.layoutMode = "HORIZONTAL";
    signOut.primaryAxisAlignItems = "CENTER";
    signOut.counterAxisAlignItems = "CENTER";
    signOut.primaryAxisSizingMode = "AUTO";
    signOut.counterAxisSizingMode = "AUTO";
    signOut.itemSpacing = 8;
    signOut.paddingLeft = 12;
    signOut.paddingRight = 12;
    signOut.paddingTop = 8;
    signOut.paddingBottom = 8;
    signOut.cornerRadius = 8;
    applyFill(signOut, "bg/muted");
    signOut.strokes = [];
    signOut.appendChild(makeIcon("logout", 14, "fg/default"));
    signOut.appendChild(mkText("Sign Out", 13, 18, "Medium", "fg/default"));
    signOut.x = 0;
    signOut.y = 366;
    content.appendChild(signOut);

    var danger = makeCard(content.width, 14);
    danger.appendChild(mkText("Delete Account", 14, 20, "Medium", "destructive/default"));
    danger.appendChild(mkText("Deleting your account will permanently delete all your data. This action cannot be undone.", 12, 16, "Regular", "fg/subtle", "LEFT", content.width - 28));
    danger.x = 0;
    danger.y = 414;
    content.appendChild(danger);
  }

  function drawSpaces(content, state) {
    function spaceRow(y, name, colorHex, subtitle, locked, editing) {
      var r = figma.createFrame();
      r.layoutMode = "HORIZONTAL";
      r.primaryAxisAlignItems = editing ? "MIN" : "CENTER";
      r.counterAxisAlignItems = editing ? "MIN" : "CENTER";
      r.primaryAxisSizingMode = "FIXED";
      r.counterAxisSizingMode = "AUTO";
      r.itemSpacing = 10;
      r.paddingLeft = 8;
      r.paddingRight = 8;
      r.paddingTop = 8;
      r.paddingBottom = 8;
      r.resize(content.width, 10);
      r.cornerRadius = 8;
      if (editing) applyFill(r, "bg/muted"); else r.fills = [];
      r.strokes = [];
      r.x = 0;
      r.y = y;

      var icon = makeIcon("capsuleFilled", 14, "fg/subtle");
      function tintHex(node, hex) {
        var s = String(hex || "").replace("#", "");
        if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
        var n = parseInt(s, 16);
        var rr = ((n >> 16) & 255) / 255;
        var gg = ((n >> 8) & 255) / 255;
        var bb = (n & 255) / 255;
        if ("fills" in node && Array.isArray(node.fills)) {
          node.fills = [{ type: "SOLID", color: { r: rr, g: gg, b: bb }, opacity: 1 }];
        }
        if ("children" in node && Array.isArray(node.children)) {
          for (var i = 0; i < node.children.length; i++) tintHex(node.children[i], hex);
        }
      }
      tintHex(icon, colorHex);
      r.appendChild(icon);

      if (editing) {
        var edits = figma.createFrame();
        edits.layoutMode = "VERTICAL";
        edits.primaryAxisSizingMode = "AUTO";
        edits.counterAxisSizingMode = "FIXED";
        edits.itemSpacing = 6;
        edits.resize(content.width - 120, 10);
        edits.fills = [];
        edits.strokes = [];
        edits.appendChild(makeInputRow("", name, false, content.width - 120, null));
        edits.appendChild(makeInputRow("", subtitle, false, content.width - 120, null));
        r.appendChild(edits);
        r.appendChild(makeIcon("check", 14, "fg/subtle"));
        r.appendChild(makeIcon("x", 14, "fg/subtle"));
      } else {
        var col = figma.createFrame();
        col.layoutMode = "VERTICAL";
        col.primaryAxisSizingMode = "AUTO";
        col.counterAxisSizingMode = "FIXED";
        col.itemSpacing = 2;
        col.resize(content.width - 120, 10);
        col.fills = [];
        col.strokes = [];
        col.appendChild(mkText(name, 13, 18, "Medium", "fg/default"));
        col.appendChild(mkText(subtitle, 12, 16, "Regular", "fg/subtle"));
        r.appendChild(col);
        if (locked) {
          var badge = figma.createFrame();
          badge.layoutMode = "HORIZONTAL";
          badge.primaryAxisAlignItems = "CENTER";
          badge.counterAxisAlignItems = "CENTER";
          badge.primaryAxisSizingMode = "AUTO";
          badge.counterAxisSizingMode = "AUTO";
          badge.itemSpacing = 4;
          badge.paddingLeft = 6;
          badge.paddingRight = 6;
          badge.paddingTop = 2;
          badge.paddingBottom = 2;
          badge.cornerRadius = 999;
          applyFill(badge, "bg/muted");
          badge.strokes = [];
          badge.appendChild(makeIcon("lock", 10, "fg/subtle"));
          badge.appendChild(mkText("Locked", 10, 14, "Medium", "fg/subtle"));
          r.appendChild(badge);
        } else {
          r.appendChild(makeIcon("pencil", 14, "fg/subtle"));
          r.appendChild(makeIcon("trash", 14, "fg/subtle"));
        }
      }
      content.appendChild(r);
      return r;
    }

    spaceRow(48, "Product", "#2783DE", "No note added", false, state === "editing");
    spaceRow(94, "Fundraising", "#FF9F0A", "Investor updates and decks", false, false);
    spaceRow(140, "Design", "#34C759", "Upgrade to unlock this space", true, false);

    if (state === "create") {
      var createRow = figma.createFrame();
      createRow.layoutMode = "HORIZONTAL";
      createRow.primaryAxisAlignItems = "CENTER";
      createRow.counterAxisAlignItems = "CENTER";
      createRow.primaryAxisSizingMode = "FIXED";
      createRow.counterAxisSizingMode = "AUTO";
      createRow.itemSpacing = 10;
      createRow.paddingLeft = 8;
      createRow.paddingRight = 8;
      createRow.paddingTop = 8;
      createRow.paddingBottom = 8;
      createRow.resize(content.width, 10);
      createRow.cornerRadius = 8;
      applyFill(createRow, "bg/muted");
      createRow.strokes = [];
      createRow.x = 0;
      createRow.y = 190;
      createRow.appendChild(makeIcon("capsuleFilled", 14, "accent/default"));
      createRow.appendChild(makeInputRow("", "Space name...", false, content.width - 120, null));
      createRow.appendChild(makeIcon("check", 14, "fg/subtle"));
      createRow.appendChild(makeIcon("x", 14, "fg/subtle"));
      content.appendChild(createRow);
    } else {
      var createBtn = figma.createFrame();
      createBtn.layoutMode = "HORIZONTAL";
      createBtn.primaryAxisAlignItems = "CENTER";
      createBtn.counterAxisAlignItems = "CENTER";
      createBtn.primaryAxisSizingMode = "AUTO";
      createBtn.counterAxisSizingMode = "AUTO";
      createBtn.itemSpacing = 6;
      createBtn.paddingLeft = 8;
      createBtn.paddingRight = 8;
      createBtn.paddingTop = 8;
      createBtn.paddingBottom = 8;
      createBtn.cornerRadius = 8;
      createBtn.fills = [];
      createBtn.strokes = [];
      createBtn.x = 0;
      createBtn.y = 190;
      createBtn.appendChild(makeIcon("plus", 14, "fg/subtle"));
      createBtn.appendChild(mkText("Create Space", 13, 18, "Medium", "fg/subtle"));
      content.appendChild(createBtn);
    }
  }

  function drawBilling(content, state) {
    if (state === "loading") {
      var sp = makeIcon("loader2", 18, "fg/subtle");
      sp.x = Math.round(content.width / 2) - 9;
      sp.y = 180;
      content.appendChild(sp);
      return;
    }

    var card = makeCard(content.width, 14);
    card.appendChild(mkText(state === "starter" ? "Starter plan" : "Pro plan", 16, 22, "Semi Bold", "fg/default"));
    if (state === "starter") {
      card.appendChild(mkText("You are on Starter. Upgrade to Pro for unlimited saved items and higher limits.", 12, 16, "Regular", "fg/subtle", "LEFT", content.width - 28));
    } else {
      card.appendChild(mkText("Your subscription is active and managed securely through Lemon Squeezy.", 12, 16, "Regular", "fg/subtle", "LEFT", content.width - 28));
    }

    function actionBtn(label, secondary) {
      var b = figma.createFrame();
      b.layoutMode = "HORIZONTAL";
      b.primaryAxisAlignItems = "CENTER";
      b.counterAxisAlignItems = "CENTER";
      b.primaryAxisSizingMode = "FIXED";
      b.counterAxisSizingMode = "FIXED";
      b.itemSpacing = 8;
      b.paddingLeft = 12;
      b.paddingRight = 12;
      b.resize(content.width - 28, 36);
      b.cornerRadius = 8;
      if (secondary) applyFill(b, "bg/muted"); else applyFill(b, "accent/default");
      b.strokes = [];
      b.appendChild(mkText(label, 13, 18, "Medium", secondary ? "fg/default" : "fg/on-accent"));
      var sp = figma.createFrame(); sp.resize(8, 1); sp.fills = []; sp.strokes = []; b.appendChild(sp);
      b.appendChild(makeIcon("arrowRight", 14, secondary ? "fg/subtle" : "fg/on-accent"));
      return b;
    }

    if (state === "starter") {
      card.appendChild(actionBtn("Upgrade to Pro (Monthly)", false));
      card.appendChild(actionBtn("Upgrade to Pro (Yearly)", true));
    } else {
      card.appendChild(actionBtn(state === "pastDue" ? "Opening billing portal..." : "Manage subscription", true));
      if (state === "pastDue") card.appendChild(mkText("We could not process your latest renewal. Open subscription management to update payment details.", 12, 16, "Regular", "warning/default", "LEFT", content.width - 28));
      if (state === "canceling") card.appendChild(mkText("Your subscription is set to cancel and will downgrade to Starter on Apr 2, 2026.", 12, 16, "Regular", "warning/default", "LEFT", content.width - 28));
    }
    card.x = 0;
    card.y = 48;
    content.appendChild(card);

    var usage = makeCard(content.width, 14);
    usage.appendChild(mkText("Usage", 16, 22, "Semi Bold", "fg/default"));
    function meter(label, current, max, warn) {
      usage.appendChild(mkText(label + "    " + current + " / " + max, 12, 16, "Regular", warn ? "warning/default" : "fg/subtle"));
      var track = figma.createRectangle();
      track.resize(content.width - 28, 6);
      track.cornerRadius = 999;
      applyFill(track, "bg/muted");
      track.strokes = [];
      usage.appendChild(track);
      var fill = figma.createRectangle();
      fill.resize(Math.max(8, Math.round((content.width - 28) * Math.min(1, current / max))), 6);
      fill.cornerRadius = 999;
      fill.fills = [warn ? makePaint("warning/default") : makePaint("accent/default")];
      fill.strokes = [];
      usage.appendChild(fill);
    }
    if (state === "starter") meter("Saved items", 92, 100, true);
    else meter("Saved items", 124, 999, false);
    meter("Spaces", 12, state === "starter" ? 20 : 999, false);
    meter("Images", 30, state === "starter" ? 50 : 999, false);
    meter("Documents", 8, state === "starter" ? 20 : 999, false);
    usage.x = 0;
    usage.y = card.y + card.height + 12;
    content.appendChild(usage);
  }

  function drawAppearance(content, selected) {
    content.appendChild(mkText("Choose how Cadie looks to you.", 13, 18, "Regular", "fg/subtle"));
    content.children[content.children.length - 1].x = 0;
    content.children[content.children.length - 1].y = 52;

    function option(x, label, isSelected) {
      var o = figma.createFrame();
      o.layoutMode = "VERTICAL";
      o.primaryAxisSizingMode = "AUTO";
      o.counterAxisSizingMode = "FIXED";
      o.itemSpacing = 8;
      o.resize(170, 10);
      o.fills = [];
      o.strokes = [];
      o.x = x;
      o.y = 86;

      var preview = figma.createRectangle();
      preview.resize(170, 110);
      preview.cornerRadius = 10;
      preview.fills = [{ type: "SOLID", color: { r: label === "Dark" ? 0.12 : 0.96, g: label === "Dark" ? 0.12 : 0.96, b: label === "Dark" ? 0.12 : 0.96 }, opacity: 1 }];
      preview.strokes = [isSelected ? makePaint("accent/default") : makePaint("border/default")];
      preview.strokeWeight = 2;
      preview.strokeAlign = "INSIDE";
      o.appendChild(preview);
      o.appendChild(mkText(label, 13, 18, "Medium", "fg/default"));
      content.appendChild(o);
    }
    option(0, "System", selected === "system");
    option(190, "Light", selected === "light");
    option(380, "Dark", selected === "dark");
  }

  function drawExtensions(content, state) {
    if (state === "empty") {
      var blob = figma.createFrame();
      blob.layoutMode = "VERTICAL";
      blob.primaryAxisAlignItems = "CENTER";
      blob.counterAxisAlignItems = "CENTER";
      blob.primaryAxisSizingMode = "AUTO";
      blob.counterAxisSizingMode = "AUTO";
      blob.itemSpacing = 8;
      blob.fills = [];
      blob.strokes = [];
      blob.appendChild(makeIcon("puzzleFilled", 24, "fg/subtle"));
      blob.appendChild(mkText("No Extensions Connected", 14, 20, "Medium", "fg/default"));
      blob.appendChild(mkText("Install the Cadie browser extension and connect it to start saving links with one click.", 12, 16, "Regular", "fg/subtle", "CENTER", 360));
      blob.x = Math.round((content.width - blob.width) / 2);
      blob.y = 180;
      content.appendChild(blob);
      return;
    }

    var row = makeCard(content.width, 14);
    var top = figma.createFrame();
    top.layoutMode = "HORIZONTAL";
    top.primaryAxisAlignItems = "CENTER";
    top.counterAxisAlignItems = "CENTER";
    top.primaryAxisSizingMode = "FIXED";
    top.counterAxisSizingMode = "AUTO";
    top.itemSpacing = 10;
    top.resize(content.width - 28, 10);
    top.fills = [];
    top.strokes = [];
    var chrome = figma.createEllipse();
    chrome.resize(28, 28);
    chrome.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.45, b: 0.93 }, opacity: 1 }];
    chrome.strokes = [];
    top.appendChild(chrome);
    var meta = figma.createFrame();
    meta.layoutMode = "VERTICAL";
    meta.primaryAxisSizingMode = "AUTO";
    meta.counterAxisSizingMode = "FIXED";
    meta.itemSpacing = 2;
    meta.resize(content.width - 120, 10);
    meta.fills = [];
    meta.strokes = [];
    meta.appendChild(mkText("Chrome Extension", 13, 18, "Medium", "fg/default"));
    meta.appendChild(mkText("Connected Feb 25, 2026 • Last used Feb 25, 2026", 11, 16, "Regular", "fg/subtle"));
    top.appendChild(meta);
    top.appendChild(makeIcon(state === "disconnecting" ? "loader2" : "trash", 14, "fg/subtle"));
    row.appendChild(top);
    row.x = 0;
    row.y = 48;
    content.appendChild(row);
  }

  function drawData(content, state) {
    var importCard = makeCard(content.width, 14);
    importCard.appendChild(mkText("Import Browser Bookmarks", 14, 20, "Medium", "fg/default"));
    importCard.appendChild(mkText("Upload bookmark HTML, preview links, then run import in background.", 12, 16, "Regular", "fg/subtle", "LEFT", content.width - 28));
    importCard.appendChild(makeInputRow("Bookmark HTML file", "bookmarks.html (84 KB)", false, content.width - 28, null));
    var previewBtn = figma.createFrame();
    previewBtn.layoutMode = "HORIZONTAL";
    previewBtn.primaryAxisAlignItems = "CENTER";
    previewBtn.counterAxisAlignItems = "CENTER";
    previewBtn.primaryAxisSizingMode = "AUTO";
    previewBtn.counterAxisSizingMode = "AUTO";
    previewBtn.itemSpacing = 6;
    previewBtn.paddingLeft = 12;
    previewBtn.paddingRight = 12;
    previewBtn.paddingTop = 8;
    previewBtn.paddingBottom = 8;
    previewBtn.cornerRadius = 8;
    applyFill(previewBtn, "accent/default");
    previewBtn.strokes = [];
    previewBtn.appendChild(makeIcon(state === "importLoading" ? "loader2" : "upload", 14, "fg/on-accent"));
    previewBtn.appendChild(mkText(state === "importLoading" ? "Parsing preview..." : "Preview Import", 13, 18, "Medium", "fg/on-accent"));
    importCard.appendChild(previewBtn);

    if (state === "importProgress") {
      importCard.appendChild(mkText("Import status: processing", 12, 16, "Medium", "fg/default"));
      importCard.appendChild(mkText("38 / 120 processed    32%", 11, 16, "Regular", "fg/subtle"));
      var t = figma.createRectangle(); t.resize(content.width - 28, 6); t.cornerRadius = 999; applyFill(t, "bg/muted"); t.strokes = []; importCard.appendChild(t);
      var f = figma.createRectangle(); f.resize(Math.round((content.width - 28) * 0.32), 6); f.cornerRadius = 999; applyFill(f, "accent/default"); f.strokes = []; importCard.appendChild(f);
    }
    importCard.x = 0;
    importCard.y = 48;
    content.appendChild(importCard);

    var exportCard = makeCard(content.width, 14);
    exportCard.appendChild(mkText("Export Active Links", 14, 20, "Medium", "fg/default"));
    exportCard.appendChild(mkText("Download a CSV backup of all active links with full metadata and space mappings.", 12, 16, "Regular", "fg/subtle", "LEFT", content.width - 28));
    var exportBtn = figma.createFrame();
    exportBtn.layoutMode = "HORIZONTAL";
    exportBtn.primaryAxisAlignItems = "CENTER";
    exportBtn.counterAxisAlignItems = "CENTER";
    exportBtn.primaryAxisSizingMode = "AUTO";
    exportBtn.counterAxisSizingMode = "AUTO";
    exportBtn.itemSpacing = 6;
    exportBtn.paddingLeft = 12;
    exportBtn.paddingRight = 12;
    exportBtn.paddingTop = 8;
    exportBtn.paddingBottom = 8;
    exportBtn.cornerRadius = 8;
    applyFill(exportBtn, "accent/default");
    exportBtn.strokes = [];
    exportBtn.appendChild(makeIcon(state === "exporting" ? "loader2" : "fileExport", 14, "fg/on-accent"));
    exportBtn.appendChild(mkText(state === "exporting" ? "Exporting..." : "Export CSV", 13, 18, "Medium", "fg/on-accent"));
    exportCard.appendChild(exportBtn);
    exportCard.x = 0;
    exportCard.y = importCard.y + importCard.height + 14;
    content.appendChild(exportCard);

    if (state === "importPreview") {
      addDialogOverlay(
        content.parent,
        "Import preview",
        "Review link count and sample, then start background import.",
        "Start Background Import",
        false,
        false
      );
    }
  }

  function drawAbout(content) {
    var app = figma.createFrame();
    app.layoutMode = "HORIZONTAL";
    app.primaryAxisAlignItems = "CENTER";
    app.counterAxisAlignItems = "CENTER";
    app.primaryAxisSizingMode = "AUTO";
    app.counterAxisSizingMode = "AUTO";
    app.itemSpacing = 12;
    app.fills = [];
    app.strokes = [];
    app.x = 0;
    app.y = 50;
    app.appendChild(makeIcon("capsuleFilled", 42, "fg/default"));
    var appCol = figma.createFrame();
    appCol.layoutMode = "VERTICAL";
    appCol.primaryAxisSizingMode = "AUTO";
    appCol.counterAxisSizingMode = "AUTO";
    appCol.itemSpacing = 2;
    appCol.fills = [];
    appCol.strokes = [];
    appCol.appendChild(mkText("Cadie", 20, 24, "Semi Bold", "fg/default"));
    appCol.appendChild(mkText("Version 1.0.0-beta", 12, 16, "Regular", "fg/subtle"));
    app.appendChild(appCol);
    content.appendChild(app);

    content.appendChild(mkText("Legal", 13, 18, "Medium", "fg/default"));
    content.children[content.children.length - 1].x = 0;
    content.children[content.children.length - 1].y = 118;
    content.appendChild(mkText("Terms and Conditions · Privacy Policy", 12, 16, "Regular", "fg/subtle"));
    content.children[content.children.length - 1].x = 0;
    content.children[content.children.length - 1].y = 138;

    var connectA = makeCard(content.width, 14);
    var r1 = figma.createFrame(); r1.layoutMode = "HORIZONTAL"; r1.primaryAxisAlignItems = "CENTER"; r1.counterAxisAlignItems = "CENTER"; r1.primaryAxisSizingMode = "AUTO"; r1.counterAxisSizingMode = "AUTO"; r1.itemSpacing = 8; r1.fills = []; r1.strokes = [];
    r1.appendChild(makeIcon("brandX", 16, "fg/default"));
    r1.appendChild(mkText("Follow us on X", 13, 18, "Medium", "fg/default"));
    connectA.appendChild(r1);
    connectA.appendChild(mkText("Get the latest updates and features", 11, 16, "Regular", "fg/subtle"));
    var follow = figma.createFrame(); follow.layoutMode = "HORIZONTAL"; follow.primaryAxisAlignItems = "CENTER"; follow.counterAxisAlignItems = "CENTER"; follow.primaryAxisSizingMode = "AUTO"; follow.counterAxisSizingMode = "AUTO"; follow.itemSpacing = 8; follow.paddingLeft = 12; follow.paddingRight = 12; follow.paddingTop = 8; follow.paddingBottom = 8; follow.cornerRadius = 8; applyFill(follow, "bg/muted"); follow.strokes = []; follow.appendChild(mkText("Follow @cadieapp_", 12, 16, "Medium", "fg/default")); follow.appendChild(makeIcon("arrowRight", 12, "fg/subtle")); connectA.appendChild(follow);
    connectA.x = 0; connectA.y = 172; content.appendChild(connectA);

    var connectB = makeCard(content.width, 14);
    var r2 = figma.createFrame(); r2.layoutMode = "HORIZONTAL"; r2.primaryAxisAlignItems = "CENTER"; r2.counterAxisAlignItems = "CENTER"; r2.primaryAxisSizingMode = "AUTO"; r2.counterAxisSizingMode = "AUTO"; r2.itemSpacing = 8; r2.fills = []; r2.strokes = [];
    r2.appendChild(makeIcon("mail", 16, "accent/default"));
    r2.appendChild(mkText("Share Feedback", 13, 18, "Medium", "fg/default"));
    connectB.appendChild(r2);
    connectB.appendChild(mkText("Found a bug or have an idea?", 11, 16, "Regular", "fg/subtle"));
    var msg = figma.createFrame(); msg.layoutMode = "HORIZONTAL"; msg.primaryAxisAlignItems = "CENTER"; msg.counterAxisAlignItems = "CENTER"; msg.primaryAxisSizingMode = "AUTO"; msg.counterAxisSizingMode = "AUTO"; msg.itemSpacing = 8; msg.paddingLeft = 12; msg.paddingRight = 12; msg.paddingTop = 8; msg.paddingBottom = 8; msg.cornerRadius = 8; applyFill(msg, "bg/muted"); msg.strokes = []; msg.appendChild(mkText("Send Message", 12, 16, "Medium", "fg/default")); msg.appendChild(makeIcon("arrowRight", 12, "fg/subtle")); connectB.appendChild(msg);
    connectB.x = 0; connectB.y = connectA.y + connectA.height + 12; content.appendChild(connectB);
  }

  function makeProfileDefault() {
    var shell = makeShell("Settings / Profile / Default", "profile");
    drawProfile(shell.content, "default");
    return shell.screen;
  }
  function makeProfileSaving() {
    var shell = makeShell("Settings / Profile / Saving", "profile");
    drawProfile(shell.content, "saving");
    return shell.screen;
  }
  function makeProfileDeleteConfirm() {
    var shell = makeShell("Settings / Profile / Delete Confirm", "profile");
    drawProfile(shell.content, "default");
    addDialogOverlay(
      shell.modal,
      "Delete Account",
      "Type hassan@cadie.app to confirm. This action cannot be undone.",
      "Delete My Account",
      true,
      true
    );
    return shell.screen;
  }

  function makeSpacesDefault() {
    var shell = makeShell("Settings / Spaces / Default", "spaces");
    drawSpaces(shell.content, "default");
    return shell.screen;
  }
  function makeSpacesCreate() {
    var shell = makeShell("Settings / Spaces / Create", "spaces");
    drawSpaces(shell.content, "create");
    return shell.screen;
  }
  function makeSpacesEditing() {
    var shell = makeShell("Settings / Spaces / Editing", "spaces");
    drawSpaces(shell.content, "editing");
    return shell.screen;
  }
  function makeSpacesDeleteConfirm() {
    var shell = makeShell("Settings / Spaces / Delete Confirm", "spaces");
    drawSpaces(shell.content, "default");
    addDialogOverlay(
      shell.modal,
      'Delete space "Product"?',
      "This action cannot be undone. All links in this space will be permanently deleted.",
      "Delete",
      true,
      false
    );
    return shell.screen;
  }

  function makeBillingLoading() {
    var shell = makeShell("Settings / Billing / Loading", "billing");
    drawBilling(shell.content, "loading");
    return shell.screen;
  }
  function makeBillingStarter() {
    var shell = makeShell("Settings / Billing / Starter Near Limit", "billing");
    drawBilling(shell.content, "starter");
    return shell.screen;
  }
  function makeBillingPro() {
    var shell = makeShell("Settings / Billing / Pro Active", "billing");
    drawBilling(shell.content, "pro");
    return shell.screen;
  }
  function makeBillingPastDue() {
    var shell = makeShell("Settings / Billing / Past Due", "billing");
    drawBilling(shell.content, "pastDue");
    return shell.screen;
  }
  function makeBillingCanceling() {
    var shell = makeShell("Settings / Billing / Canceling", "billing");
    drawBilling(shell.content, "canceling");
    return shell.screen;
  }

  function makeAppearanceSystem() {
    var shell = makeShell("Settings / Appearance / System", "appearance");
    drawAppearance(shell.content, "system");
    return shell.screen;
  }
  function makeAppearanceLight() {
    var shell = makeShell("Settings / Appearance / Light", "appearance");
    drawAppearance(shell.content, "light");
    return shell.screen;
  }
  function makeAppearanceDark() {
    var shell = makeShell("Settings / Appearance / Dark", "appearance");
    drawAppearance(shell.content, "dark");
    return shell.screen;
  }

  function makeExtensionsEmpty() {
    var shell = makeShell("Settings / Extensions / Empty", "extensions");
    drawExtensions(shell.content, "empty");
    return shell.screen;
  }
  function makeExtensionsConnected() {
    var shell = makeShell("Settings / Extensions / Connected", "extensions");
    drawExtensions(shell.content, "connected");
    return shell.screen;
  }
  function makeExtensionsDisconnectConfirm() {
    var shell = makeShell("Settings / Extensions / Disconnect Confirm", "extensions");
    drawExtensions(shell.content, "connected");
    addDialogOverlay(
      shell.modal,
      "Disconnect Extension",
      "Are you sure you want to disconnect Chrome Extension? You'll need to reconnect it to continue saving links.",
      "Disconnect",
      true,
      false
    );
    return shell.screen;
  }

  function makeDataIdle() {
    var shell = makeShell("Settings / Data / Idle", "data");
    drawData(shell.content, "idle");
    return shell.screen;
  }
  function makeDataImportPreview() {
    var shell = makeShell("Settings / Data / Import Preview", "data");
    drawData(shell.content, "importPreview");
    return shell.screen;
  }
  function makeDataImportProcessing() {
    var shell = makeShell("Settings / Data / Import Processing", "data");
    drawData(shell.content, "importProgress");
    return shell.screen;
  }
  function makeDataExporting() {
    var shell = makeShell("Settings / Data / Exporting", "data");
    drawData(shell.content, "exporting");
    return shell.screen;
  }

  function makeAboutDefault() {
    var shell = makeShell("Settings / About / Default", "about");
    drawAbout(shell.content);
    return shell.screen;
  }

  var existing = figma.currentPage.findAll(function(n) {
    return n.type === "FRAME" && n.name.indexOf("Cadie / Settings / Mirror /") === 0;
  });
  for (var ei = 0; ei < existing.length; ei++) existing[ei].remove();

  var startY = 0;
  for (var ci = 0; ci < figma.currentPage.children.length; ci++) {
    var bottom = figma.currentPage.children[ci].y + figma.currentPage.children[ci].height;
    if (bottom > startY) startY = bottom;
  }
  startY += 120;

  var screens = [
    makeProfileDefault(),
    makeProfileSaving(),
    makeProfileDeleteConfirm(),
    makeSpacesDefault(),
    makeSpacesCreate(),
    makeSpacesEditing(),
    makeSpacesDeleteConfirm(),
    makeBillingLoading(),
    makeBillingStarter(),
    makeBillingPro(),
    makeBillingPastDue(),
    makeBillingCanceling(),
    makeAppearanceSystem(),
    makeAppearanceLight(),
    makeAppearanceDark(),
    makeExtensionsEmpty(),
    makeExtensionsConnected(),
    makeExtensionsDisconnectConfirm(),
    makeDataIdle(),
    makeDataImportPreview(),
    makeDataImportProcessing(),
    makeDataExporting(),
    makeAboutDefault()
  ];

  var cols = 2;
  var gapX = 120;
  var gapY = 120;
  var all = [];
  for (var i = 0; i < screens.length; i++) {
    var c = i % cols;
    var r = Math.floor(i / cols);
    screens[i].name = "Cadie / Settings / Mirror / " + screens[i].name;
    screens[i].x = c * (SCREEN_W + gapX);
    screens[i].y = startY + r * (SCREEN_H + gapY);
    figma.currentPage.appendChild(screens[i]);
    all.push(screens[i]);
  }

  figma.viewport.scrollAndZoomIntoView(all);
  figma.notify("✅  Created Settings mirror screens with all tabs and key states.");
  figma.closePlugin();
}

// ─── Router ──────────────────────────────────────────────────────────────────

async function main() {
  switch (figma.command) {
    case "create":  createVariables();               break;
    case "bind":    bindVariables();                 break;
    case "text":    await createTextStyles();        break;
    case "buttons": await createButtonComponents();  break;
    case "tier1":   await createTier1Components();   break;
    case "tier2":   await createTier2Components();   break;
    case "onboarding": await createOnboardingFlowScreens(); break;
    case "home": await createHomeMirrorScreens(); break;
    case "settings": await createSettingsMirrorScreens(); break;
    default:        createVariables();               break;
  }
}

main().catch(err => {
  figma.notify("❌  " + err.message);
  figma.closePlugin();
});
