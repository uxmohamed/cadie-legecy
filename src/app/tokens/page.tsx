"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "@/components/theme-provider";
import { Info } from "lucide-react";
import { SPACE_COLORS } from "@/features/spaces/constants/space-colors";

const BG_TOKENS = [
  { name: "--bg", desc: "Main app background" },
  { name: "--bg-surface", desc: "Cards, panels, sidebars" },
  { name: "--bg-elevated", desc: "Modals, popovers" },
  { name: "--bg-muted", desc: "Subtle/disabled backgrounds" },
  { name: "--bg-emphasis", desc: "Highlighted areas" },
  { name: "--bg-inverse", desc: "Inverted contrast" },
  { name: "--bg-overlay", desc: "Dark overlays" },
  { name: "--bg-scrim", desc: "Modal backdrop" },
  { name: "--bg-hover", desc: "Hover state" },
  { name: "--bg-active", desc: "Active/pressed state" },
  { name: "--bg-selected", desc: "Selected items" },
  { name: "--bg-input", desc: "Form fields" },
] as const;

const FG_TOKENS = [
  { name: "--fg", desc: "Primary text" },
  { name: "--fg-muted", desc: "Secondary text" },
  { name: "--fg-subtle", desc: "Tertiary/placeholder" },
  { name: "--fg-disabled", desc: "Disabled text" },
  { name: "--fg-inverse", desc: "Text on inverse bg", bg: "var(--bg-inverse)" },
  { name: "--fg-on-accent", desc: "Text on accent", bg: "var(--accent)" },
  { name: "--fg-on-overlay", desc: "Text on overlay", bg: "var(--bg-overlay)" },
  { name: "--fg-on-overlay-muted", desc: "Secondary overlay text", bg: "var(--bg-overlay)" },
] as const;

const BORDER_TOKENS = [
  { name: "--border", desc: "Default borders" },
  { name: "--border-primary", desc: "Primary borders" },
  { name: "--border-muted", desc: "Subtle borders" },
  { name: "--border-emphasis", desc: "Strong/focus borders" },
  { name: "--border-hover", desc: "Hover state" },
  { name: "--border-overlay", desc: "Overlay borders" },
  { name: "--border-destructive", desc: "Error borders" },
] as const;

const ACCENT_TOKENS = [
  { group: "Accent", tokens: [
    { name: "--accent", desc: "Primary brand" },
    { name: "--accent-hover", desc: "Accent hover" },
    { name: "--accent-muted", desc: "Subtle accent bg" },
  ]},
  { group: "Destructive", tokens: [
    { name: "--destructive", desc: "Error/danger" },
    { name: "--destructive-hover", desc: "Destructive hover" },
    { name: "--destructive-muted", desc: "Subtle error bg" },
  ]},
  { group: "Success", tokens: [
    { name: "--success", desc: "Success state" },
    { name: "--success-muted", desc: "Subtle success bg" },
  ]},
  { group: "Warning", tokens: [
    { name: "--warning", desc: "Warning state" },
    { name: "--warning-muted", desc: "Subtle warning bg" },
  ]},
] as const;

const BTN_TOKENS = [
  { name: "--btn-primary", hover: "--btn-primary-hover", desc: "Primary" },
  { name: "--btn-neutral", hover: "--btn-neutral-hover", desc: "Neutral" },
  { name: "--btn-secondary", hover: "--btn-secondary-hover", desc: "Secondary" },
  { name: "--btn-ghost-hover", hover: null, desc: "Ghost hover" },
  { name: "--btn-overlay-hover", hover: null, desc: "Overlay hover" },
  { name: "--ring", hover: null, desc: "Focus ring" },
  { name: "--ring-offset", hover: null, desc: "Ring offset" },
] as const;

const SHADOW_TOKENS = [
  { name: "--shadow-sm", label: "sm" },
  { name: "--shadow", label: "default" },
  { name: "--shadow-md", label: "md" },
  { name: "--shadow-lg", label: "lg" },
] as const;

const RADIUS_TOKENS = [
  { name: "--radius-sm", label: "sm", tw: "radius - 4px" },
  { name: "--radius-md", label: "md", tw: "radius - 2px" },
  { name: "--radius-lg", label: "lg", tw: "radius (base)" },
  { name: "--radius-xl", label: "xl", tw: "radius + 4px" },
] as const;

const OVERLAY_TOKENS = [
  { name: "--overlay-text-primary", desc: "Primary text" },
  { name: "--overlay-text-secondary", desc: "Secondary text" },
  { name: "--overlay-border", desc: "Border" },
  { name: "--overlay-hover", desc: "Hover" },
  { name: "--overlay-separator", desc: "Separator" },
] as const;

function SectionHeading({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="text-xl font-semibold text-[var(--fg)]">{children}</h2>
      {count != null && (
        <span className="text-sm text-[var(--fg-subtle)]">{count} tokens</span>
      )}
    </div>
  );
}

function ColorDetails({ varName, themeMode }: { varName: string, themeMode: string }) {
  const [hex, setHex] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let rawVal = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (!rawVal) {
        rawVal = window.getComputedStyle(document.body).getPropertyValue(varName).trim();
      }
      setRaw(rawVal);

      const el = document.createElement("div");
      el.style.backgroundColor = `var(${varName})`;
      el.style.display = "none";
      document.body.appendChild(el);
      
      const computed = window.getComputedStyle(el).backgroundColor;
      
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx && computed && computed !== "rgba(0, 0, 0, 0)" && computed !== "transparent") {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = computed;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        
        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');
        let aHex = "";
        if (a < 255) {
          aHex = a.toString(16).padStart(2, '0');
        }
        
        // Ensure that a pure transparent value isn't rendered as a black patch
        if (a === 0) {
           setHex("transparent");
        } else {
           setHex(`#${rHex}${gHex}${bHex}${aHex}`.toUpperCase());
        }
      } else if (computed === "rgba(0, 0, 0, 0)" || computed === "transparent") {
        setHex("transparent");
      } else {
        setHex(computed);
      }
      
      document.body.removeChild(el);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [varName, themeMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!raw && !hex) return null;

  return (
    <div ref={containerRef} className="relative mt-1 inline-flex items-center">
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="focus:outline-none"
        type="button"
        title="View color details"
      >
        <Info className={`h-4 w-4 transition-colors content-end ${isOpen ? 'text-[var(--fg)]' : 'text-[var(--fg-subtle)] hover:text-[var(--fg)] cursor-pointer'}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-2 w-max max-w-[280px] sm:max-w-xs p-3 rounded-lg shadow-xl shadow-[var(--shadow-lg)] bg-[var(--bg-elevated)] border border-[var(--border)] text-left cursor-default">
          {raw && (
            <div>
              <span className="text-[var(--fg-subtle)] uppercase text-[10px] font-semibold tracking-wider">Raw Value</span>
              <div className="font-mono text-xs text-[var(--fg)] mt-0.5 max-w-full whitespace-normal break-words">{raw}</div>
            </div>
          )}
          {hex && (
            <div className="pt-2 border-t border-[var(--border-muted)]">
              <span className="text-[var(--fg-subtle)] uppercase text-[10px] font-semibold tracking-wider">Resolved Hex</span>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-4 h-4 rounded-sm border border-[var(--border-muted)] shadow-[var(--shadow-sm)] shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="font-mono text-sm font-medium text-[var(--fg)]">{hex}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DesignTokensPage() {
  const { theme, setTheme } = useTheme();
  const effectiveTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "m" || e.key === "M") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setTheme(effectiveTheme === "light" ? "dark" : "light");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [effectiveTheme, setTheme]);

  const totalTokens = BG_TOKENS.length + FG_TOKENS.length + BORDER_TOKENS.length +
    ACCENT_TOKENS.reduce((n, g) => n + g.tokens.length, 0) + BTN_TOKENS.length +
    SHADOW_TOKENS.length + RADIUS_TOKENS.length + OVERLAY_TOKENS.length +
    Object.keys(SPACE_COLORS).length;

  return (
    <div className="min-h-screen bg-bg p-8 space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--fg)]">Design Tokens</h1>
          <p className="text-[var(--fg-muted)] mt-1">{totalTokens} tokens in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
            style={{
              backgroundColor: "var(--bg-emphasis)",
              color: "var(--fg)",
            }}
          >
            {effectiveTheme === "light" ? "Light" : "Dark"}
          </span>
          <span className="text-xs text-[var(--fg-subtle)]">Press M to toggle mode</span>
        </div>
      </div>

      {/* 1. Backgrounds */}
      <section>
        <SectionHeading count={BG_TOKENS.length}>Backgrounds</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {BG_TOKENS.map((t) => (
            <div key={t.name} className="space-y-2">
              <div
                className="h-20 w-full rounded-lg border border-[var(--border)]"
                style={{ backgroundColor: `var(${t.name})` }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{t.desc}</p>
                <p className="text-xs font-mono text-[var(--fg-subtle)]">{t.name}</p>
                <ColorDetails varName={t.name} themeMode={effectiveTheme} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Foreground / Text */}
      <section>
        <SectionHeading count={FG_TOKENS.length}>Foreground / Text</SectionHeading>
        <div className="space-y-3">
          {FG_TOKENS.map((t) => (
            (() => {
              const bg = "bg" in t ? t.bg : undefined;
              return (
                <div
                  key={t.name}
                  className="flex items-center gap-4 rounded-lg border border-[var(--border)] p-4"
                  style={{ backgroundColor: bg ?? "transparent" }}
                >
                  <div className="shrink-0 w-56 flex flex-col">
                    <span className="font-mono text-xs" style={{ color: bg ? `var(${t.name})` : "var(--fg-subtle)" }}>
                      {t.name}
                    </span>
                    <ColorDetails varName={t.name} themeMode={effectiveTheme} />
                  </div>
                  <p className="text-base" style={{ color: `var(${t.name})` }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              );
            })()
          ))}
        </div>
      </section>

      {/* 3. Borders */}
      <section>
        <SectionHeading count={BORDER_TOKENS.length}>Borders</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BORDER_TOKENS.map((t) => (
            <div key={t.name} className="space-y-2">
              <div
                className="h-20 w-full rounded-lg"
                style={{ border: `2px solid var(${t.name})`, backgroundColor: "var(--bg-surface)" }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{t.desc}</p>
                <p className="text-xs font-mono text-[var(--fg-subtle)]">{t.name}</p>
                <ColorDetails varName={t.name} themeMode={effectiveTheme} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Accent Colors */}
      <section>
        <SectionHeading count={ACCENT_TOKENS.reduce((n, g) => n + g.tokens.length, 0)}>Accent Colors</SectionHeading>
        <div className="space-y-6">
          {ACCENT_TOKENS.map((group) => (
            <div key={group.group}>
              <p className="text-sm font-medium text-[var(--fg-muted)] mb-3">{group.group}</p>
              <div className="flex flex-wrap gap-4">
                {group.tokens.map((t) => (
                  <div key={t.name} className="flex flex-col items-center gap-2">
                    <div
                      className="h-12 w-12 rounded-xl"
                      style={{ backgroundColor: `var(${t.name})` }}
                    />
                    <div className="text-center w-full">
                      <p className="text-xs font-medium text-[var(--fg)]">{t.desc}</p>
                      <p className="text-[10px] font-mono text-[var(--fg-subtle)]">{t.name}</p>
                      <ColorDetails varName={t.name} themeMode={effectiveTheme} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Buttons */}
      <section>
        <SectionHeading count={BTN_TOKENS.length}>Buttons / Interactive</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BTN_TOKENS.map((t) => (
            <div key={t.name} className="space-y-2">
              <div className="flex gap-2">
                <div
                  className="h-12 flex-1 rounded-lg"
                  style={{ backgroundColor: `var(${t.name})` }}
                />
                {t.hover && (
                  <div
                    className="h-12 flex-1 rounded-lg"
                    style={{ backgroundColor: `var(${t.hover})` }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{t.desc}</p>
                <p className="text-[10px] font-mono text-[var(--fg-subtle)]">
                  {t.name}{t.hover ? ` / ${t.hover}` : ""}
                </p>
                <ColorDetails varName={t.name} themeMode={effectiveTheme} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Shadows */}
      <section>
        <SectionHeading count={SHADOW_TOKENS.length}>Shadows</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {SHADOW_TOKENS.map((t) => (
            <div key={t.name} className="space-y-2">
              <div
                className="h-24 w-full rounded-lg"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  boxShadow: `var(${t.name})`,
                }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{t.label}</p>
                <p className="text-xs font-mono text-[var(--fg-subtle)]">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Space Colors */}
      <section>
        <SectionHeading count={Object.keys(SPACE_COLORS).length}>Space Colors</SectionHeading>
        <div className="flex flex-wrap gap-5">
          {Object.entries(SPACE_COLORS).map(([key, { cssVar, label }]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: cssVar }}
              />
              <div className="text-center w-full">
                <p className="text-xs font-medium text-[var(--fg)]">{label}</p>
                <p className="text-[10px] font-mono text-[var(--fg-subtle)]">{cssVar}</p>
                <ColorDetails varName={cssVar} themeMode={effectiveTheme} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Radius */}
      <section>
        <SectionHeading count={RADIUS_TOKENS.length}>Radius</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RADIUS_TOKENS.map((t) => (
            <div key={t.name} className="space-y-2">
              <div
                className="h-24 w-full border-2 border-[var(--border-emphasis)]"
                style={{
                  borderRadius: `var(${t.name})`,
                  backgroundColor: "var(--bg-surface)",
                }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">{t.label}</p>
                <p className="text-xs font-mono text-[var(--fg-subtle)]">{t.name}</p>
                <p className="text-[10px] text-[var(--fg-disabled)]">{t.tw}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Overlay Tokens */}
      <section>
        <SectionHeading count={OVERLAY_TOKENS.length}>Overlay Tokens</SectionHeading>
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-overlay)" }}
        >
          {OVERLAY_TOKENS.map((t) => {
            const isText = t.name.includes("text");
            const isBorder = t.name.includes("border") || t.name.includes("separator");
            const isHover = t.name.includes("hover");

            return (
              <div key={t.name} className="flex items-center gap-4">
                <div className="shrink-0 w-56 flex flex-col">
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--overlay-text-secondary)" }}
                  >
                    {t.name}
                  </span>
                  <ColorDetails varName={t.name} themeMode={effectiveTheme} />
                </div>
                {isText && (
                  <span style={{ color: `var(${t.name})` }}>
                    Sample overlay text — {t.desc}
                  </span>
                )}
                {isBorder && (
                  <div
                    className="h-10 flex-1 rounded-md"
                    style={{ border: `2px solid var(${t.name})` }}
                  />
                )}
                {isHover && (
                  <div
                    className="h-10 w-32 rounded-md"
                    style={{ backgroundColor: `var(${t.name})` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
