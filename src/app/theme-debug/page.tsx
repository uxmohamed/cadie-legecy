"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { primitives } from "@/theme/primitives";
import { getSemanticTokens, type ThemeMode } from "@/theme/semantic";
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon } from "@tabler/icons-react";

interface ColorSwatchProps {
  name: string;
  value: string;
  cssVar?: string;
  isText?: boolean;
  isBorder?: boolean;
  isShadow?: boolean;
}

function ColorSwatch({ name, value, cssVar, isText = false, isBorder = false, isShadow = false }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = cssVar ? `var(${cssVar})` : value;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Optionally show error feedback to user
    }
  };

  if (isShadow) {
    return (
      <div className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-[var(--text-primary)]">{name}</span>
            {cssVar && (
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{cssVar}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div
          className="h-20 w-full rounded border border-[var(--border-primary)]"
          style={{ boxShadow: value }}
        />
        <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{value}</span>
      </div>
    );
  }

  if (isBorder) {
    return (
      <div className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-[var(--text-primary)]">{name}</span>
            {cssVar && (
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{cssVar}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div
          className="h-20 w-full rounded border-2 bg-[var(--bg-l2-solid)]"
          style={{ borderColor: value }}
        />
        <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{value}</span>
      </div>
    );
  }

  if (isText) {
    const bgColor = name.includes("always-white") || name.includes("inverse")
      ? "var(--bg-inverse)"
      : name.includes("always-black")
      ? "var(--white)"
      : "var(--bg-main-container)";
    
    return (
      <div className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-[var(--text-primary)]">{name}</span>
            {cssVar && (
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{cssVar}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div
          className="flex h-20 w-full items-center justify-center rounded border border-[var(--border-primary)] px-4 text-lg font-semibold"
          style={{ backgroundColor: bgColor, color: value }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
        <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{value}</span>
      </div>
    );
  }

  // Check if value is a gradient
  const isGradient = value.includes("gradient");

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-[var(--text-primary)]">{name}</span>
          {cssVar && (
            <span className="font-mono text-xs text-[var(--text-tertiary)]">{cssVar}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div
        className="h-20 w-full rounded border border-[var(--border-primary)]"
        style={isGradient ? { background: value } : { backgroundColor: value }}
      />
      <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{value}</span>
    </div>
  );
}

interface ColorSectionProps {
  title: string;
  description?: string;
  colors: Array<{ name: string; value: string; cssVar?: string; isText?: boolean; isBorder?: boolean; isShadow?: boolean }>;
}

function ColorSection({ title, description, colors }: ColorSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map((color) => (
          <ColorSwatch
            key={color.name}
            name={color.name}
            value={color.value}
            cssVar={color.cssVar}
            isText={color.isText}
            isBorder={color.isBorder}
            isShadow={color.isShadow}
          />
        ))}
      </div>
    </div>
  );
}

interface OverlayDemoProps {
  overlayVar: string;
  overlayValue: string;
  overlayName: string;
}

function OverlayDemo({ overlayVar, overlayValue, overlayName }: OverlayDemoProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs font-medium text-[var(--text-primary)]">{overlayName}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative h-24 w-full overflow-hidden rounded-lg border border-[var(--border-primary)]">
          <div className="h-full w-full bg-[var(--bg-main-container)]" />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayValue }}
          />
          <div className="relative flex h-full items-center justify-center px-4">
            <span className="text-xs text-[var(--text-primary)]">On main container</span>
          </div>
        </div>
        <div className="relative h-24 w-full overflow-hidden rounded-lg border border-[var(--border-primary)]">
          <div className="h-full w-full bg-[var(--bg-inverse)]" />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayValue }}
          />
          <div className="relative flex h-full items-center justify-center px-4">
            <span className="text-xs text-[var(--text-inverse)]">On inverse</span>
          </div>
        </div>
      </div>
      <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{overlayValue}</span>
    </div>
  );
}

export default function ThemeDebugPage() {
  const { theme, setTheme } = useTheme();
  const [currentMode, setCurrentMode] = useState<ThemeMode>("light");
  const [semanticTokens, setSemanticTokens] = useState<ReturnType<typeof getSemanticTokens>>(
    getSemanticTokens("light")
  );

  useEffect(() => {
    // Determine effective theme
    let effectiveTheme: ThemeMode = "light";
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        effectiveTheme = "dark";
      } else if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
    }

    setCurrentMode(effectiveTheme);
    setSemanticTokens(getSemanticTokens(effectiveTheme));

    // Listen for system theme changes if in system mode
    if (typeof window !== "undefined" && theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        setCurrentMode(newTheme);
        setSemanticTokens(getSemanticTokens(newTheme));
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    // Always toggle between light and dark, ignoring system mode for debug purposes
    const newTheme = currentMode === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Prepare primitive colors
  const baseColors = [
    { name: "white", value: primitives.base.white, cssVar: "--white" },
    { name: "black", value: primitives.base.black, cssVar: "--black" },
    { name: "transparent", value: primitives.base.transparent, cssVar: "--transparent" },
  ];

  const greyColors = Object.entries(primitives.grey).map(([key, value]) => ({
    name: `grey-${key}`,
    value,
    cssVar: `--grey-${key}`,
  }));

  const caddyColors = Object.entries(primitives.caddy).map(([key, value]) => ({
    name: `caddy-${key}`,
    value,
    cssVar: `--caddy-color-${key}`,
  }));

  const greenColors = Object.entries(primitives.green).map(([key, value]) => ({
    name: `green-${key}`,
    value,
    cssVar: `--green-${key}`,
  }));

  const yellowColors = Object.entries(primitives.yellow).map(([key, value]) => ({
    name: `yellow-${key}`,
    value,
    cssVar: `--yellow-${key}`,
  }));

  const redColors = Object.entries(primitives.red).map(([key, value]) => ({
    name: `red-${key}`,
    value,
    cssVar: `--red-${key}`,
  }));

  const opacityValues = Object.entries(primitives.opacity).map(([key, value]) => ({
    name: `opacity-${key}`,
    value,
    cssVar: `--opacity-${key}`,
  }));

  // Prepare semantic tokens
  const textColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("text-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
      isText: true,
    }));

  const iconColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("icon-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
      isText: true,
    }));

  const ctaColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("cta-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  const borderColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("border-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
      isBorder: true,
    }));

  const backgroundColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("bg-") && !key.startsWith("bg-overlay-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  const overlayColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("bg-overlay-") || key.startsWith("overlay-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  const accentColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("accent-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  const legacyColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("button-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  const shadowValues = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("shadow-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
      isShadow: true,
    }));

  const scrollbarColors = Object.entries(semanticTokens)
    .filter(([key]) => key.startsWith("scrollbar-"))
    .map(([key, value]) => ({
      name: key,
      value,
      cssVar: `--${key}`,
    }));

  // Separate overlay backgrounds from overlay-specific tokens
  const bgOverlayColors = overlayColors.filter((c) => c.name.startsWith("bg-overlay-"));
  const overlaySpecificTokens = overlayColors.filter((c) => c.name.startsWith("overlay-")).map((token) => ({
    ...token,
    isText: token.name.startsWith("overlay-text-"),
    isBorder: token.name.startsWith("overlay-border"),
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-main-container)] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Theme Debug</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Current theme: <span className="font-mono">{currentMode}</span>
            </p>
          </div>
          <Button onClick={toggleTheme} variant="outline" size="lg" className="w-full sm:w-auto">
            {currentMode === "light" ? (
              <>
                <IconMoon className="h-5 w-5" />
                Switch to Dark
              </>
            ) : (
              <>
                <IconSun className="h-5 w-5" />
                Switch to Light
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        <Accordion type="multiple" defaultValue={["primitives", "semantic-bg"]} className="space-y-4">
          {/* Primitives */}
          <AccordionItem value="primitives">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Primitives</span>
            </AccordionTrigger>
            <AccordionPanel>
              <div className="space-y-8">
                <ColorSection
                  title="Base Colors"
                  colors={baseColors}
                />
                <ColorSection
                  title="Grey Scale"
                  colors={greyColors}
                />
                <ColorSection
                  title="Caddy Scale"
                  colors={caddyColors}
                />
                <ColorSection
                  title="Green Scale"
                  colors={greenColors}
                />
                <ColorSection
                  title="Yellow Scale"
                  colors={yellowColors}
                />
                <ColorSection
                  title="Red Scale"
                  colors={redColors}
                />
                <ColorSection
                  title="Opacity Values"
                  description="Opacity values used in color-mix operations"
                  colors={opacityValues.map((op) => ({
                    ...op,
                    isText: false,
                  }))}
                />
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* Semantic Tokens */}
          <AccordionItem value="semantic-text">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Text Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Text Tokens"
                description="Text colors that adapt to light/dark mode"
                colors={textColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-icon">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Icon Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Icon Tokens"
                description="Icon colors that adapt to light/dark mode"
                colors={iconColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-cta">
            <AccordionTrigger>
              <span className="text-lg font-semibold">CTA (Button) Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="CTA Tokens"
                description="Button background colors with states (default, hover, active, disabled)"
                colors={ctaColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-border">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Border Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Border Tokens"
                description="Border colors with different emphasis levels"
                colors={borderColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-bg">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Background Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <div className="space-y-8">
                {/* Main Containers */}
                <ColorSection
                  title="Main Containers"
                  description="Primary background colors for main container and sidepanel"
                  colors={backgroundColors.filter((c) => 
                    c.name === "bg-main-container" || c.name === "bg-sidepanel"
                  )}
                />

                {/* Layered Backgrounds - Solid */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Layered Backgrounds (Solid)
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Layered backgrounds showing depth hierarchy (l0 = deepest, l3 = highest)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {["bg-l0-solid", "bg-l1-solid", "bg-l2-solid", "bg-l3-solid"].map((layerName) => {
                      const layer = backgroundColors.find((c) => c.name === layerName);
                      if (!layer) return null;
                      
                      const layerIndex = parseInt(layerName.split("-l")[1]?.split("-")[0] || "0");
                      const mainContainer = backgroundColors.find((c) => c.name === "bg-main-container");
                      
                      return (
                        <div
                          key={layer.name}
                          className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{layer.name}</span>
                              {layer.cssVar && (
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">{layer.cssVar}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Show layer on main container background for context */}
                          <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[var(--border-primary)]">
                            {/* Base: main container */}
                            {mainContainer && (
                              <div
                                className="absolute inset-0"
                                style={{ backgroundColor: mainContainer.value }}
                              />
                            )}
                            {/* The layer itself */}
                            <div
                              className="absolute inset-x-2 inset-y-2 rounded-md border border-[var(--border-primary)]"
                              style={{ backgroundColor: layer.value }}
                            >
                              <div className="flex h-full items-center justify-center px-4">
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                  Layer {layerIndex}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{layer.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Layered Backgrounds - Glass */}
                <ColorSection
                  title="Layered Backgrounds (Glass)"
                  description="Glassmorphic layered backgrounds with transparency"
                  colors={backgroundColors.filter((c) => c.name.startsWith("bg-l") && c.name.includes("glass"))}
                />

                {/* Special Backgrounds */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Special Backgrounds
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Emphasis, inverse, and scrim backgrounds
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {backgroundColors.filter((c) => 
                      c.name === "bg-emphasis" || c.name === "bg-inverse" || c.name === "bg-scrim"
                    ).map((bg) => {
                      const isScrim = bg.name === "bg-scrim";
                      const isInverse = bg.name === "bg-inverse";
                      const mainContainer = backgroundColors.find((c) => c.name === "bg-main-container");
                      
                      return (
                        <div
                          key={bg.name}
                          className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{bg.name}</span>
                              {bg.cssVar && (
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">{bg.cssVar}</span>
                              )}
                            </div>
                          </div>
                          
                          {isScrim ? (
                            // Scrim shown as overlay
                            <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[var(--border-primary)]">
                              {mainContainer && (
                                <div
                                  className="absolute inset-0"
                                  style={{ backgroundColor: mainContainer.value }}
                                />
                              )}
                              <div
                                className="absolute inset-0"
                                style={{ backgroundColor: bg.value }}
                              />
                              <div className="relative flex h-full items-center justify-center px-4">
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                  Scrim overlay
                                </span>
                              </div>
                            </div>
                          ) : isInverse ? (
                            // Inverse shown with inverse text
                            <div
                              className="h-32 w-full rounded-lg border border-[var(--border-primary)] flex items-center justify-center px-4"
                              style={{ backgroundColor: bg.value }}
                            >
                              <span className="text-xs font-semibold text-[var(--text-inverse)]">
                                Inverse background
                              </span>
                            </div>
                          ) : (
                            // Emphasis shown on main container
                            <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[var(--border-primary)]">
                              {mainContainer && (
                                <div
                                  className="absolute inset-0"
                                  style={{ backgroundColor: mainContainer.value }}
                                />
                              )}
                              <div
                                className="absolute inset-x-4 inset-y-4 rounded-md border border-[var(--border-primary)]"
                                style={{ backgroundColor: bg.value }}
                              >
                                <div className="flex h-full items-center justify-center px-4">
                                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                                    Emphasis
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{bg.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Field Backgrounds */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Field Backgrounds
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Input field background colors with states
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {backgroundColors.filter((c) => c.name.startsWith("bg-field-")).map((field) => (
                      <div
                        key={field.name}
                        className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs text-[var(--text-primary)]">{field.name}</span>
                            {field.cssVar && (
                              <span className="font-mono text-xs text-[var(--text-tertiary)]">{field.cssVar}</span>
                            )}
                          </div>
                        </div>
                        <div
                          className="relative h-20 w-full rounded border border-[var(--border-primary)] p-4"
                          style={{ backgroundColor: field.value }}
                        >
                          <div className="flex h-full items-center">
                            <span className="text-sm text-[var(--text-primary)]">
                              Input field background
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cell Backgrounds */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Cell Backgrounds
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Table/list cell background colors with hover and active states
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {backgroundColors.filter((c) => c.name.startsWith("bg-cell-")).map((cell) => (
                      <div
                        key={cell.name}
                        className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs text-[var(--text-primary)]">{cell.name}</span>
                            {cell.cssVar && (
                              <span className="font-mono text-xs text-[var(--text-tertiary)]">{cell.cssVar}</span>
                            )}
                          </div>
                        </div>
                        <div
                          className="relative h-20 w-full rounded border border-[var(--border-primary)] p-4"
                          style={{ backgroundColor: cell.value }}
                        >
                          <div className="flex h-full items-center">
                            <span className="text-sm text-[var(--text-primary)]">
                              Table cell background
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{cell.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Gutter */}
                {backgroundColors.find((c) => c.name === "bg-code-gutter") && (
                  <ColorSection
                    title="Code Backgrounds"
                    description="Code editor gutter background"
                    colors={backgroundColors.filter((c) => c.name === "bg-code-gutter")}
                  />
                )}
              </div>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-overlay">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Overlay Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <div className="space-y-8">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Overlay Backgrounds
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Semi-transparent overlay colors shown on different backgrounds
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {bgOverlayColors.map((overlay) => (
                      <div
                        key={overlay.name}
                        className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                      >
                        <OverlayDemo
                          overlayVar={overlay.cssVar || ""}
                          overlayValue={overlay.value}
                          overlayName={overlay.name}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Overlay-Specific Tokens
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Tokens used within overlay components (dropdowns, menus, tooltips)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {overlaySpecificTokens.map((token) => {
                      // Show overlay-text tokens on overlay-bg background
                      if (token.name.startsWith("overlay-text-")) {
                        const overlayBgToken = overlaySpecificTokens.find((t) => t.name === "overlay-bg");
                        if (overlayBgToken) {
                          return (
                            <div
                              key={token.name}
                              className="group relative flex flex-col gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l2-solid)] p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono text-xs text-[var(--text-primary)]">{token.name}</span>
                                  {token.cssVar && (
                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">{token.cssVar}</span>
                                  )}
                                </div>
                              </div>
                              <div
                                className="flex h-20 w-full items-center justify-center rounded border border-[var(--border-primary)] px-4 text-lg font-semibold"
                                style={{ backgroundColor: overlayBgToken.value, color: token.value }}
                              >
                                Sample text on overlay-bg
                              </div>
                              <span className="font-mono text-xs text-[var(--text-secondary)] break-all">{token.value}</span>
                            </div>
                          );
                        }
                      }
                      // Use regular ColorSwatch for other tokens
                      return (
                        <ColorSwatch
                          key={token.name}
                          name={token.name}
                          value={token.value}
                          cssVar={token.cssVar}
                          isText={token.isText ?? false}
                          isBorder={token.isBorder ?? false}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-accent">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Accent Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Accent Tokens"
                description="Accent colors for success, error, info states"
                colors={accentColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-legacy">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Legacy/Compat Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Legacy Button Tokens"
                description="Legacy button colors for backward compatibility"
                colors={legacyColors}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-shadow">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Shadows</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Shadow Tokens"
                description="Box shadow values for different elevation levels"
                colors={shadowValues}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem value="semantic-scrollbar">
            <AccordionTrigger>
              <span className="text-lg font-semibold">Scrollbar Colors</span>
            </AccordionTrigger>
            <AccordionPanel>
              <ColorSection
                title="Scrollbar Tokens"
                description="Scrollbar colors for different states"
                colors={scrollbarColors}
              />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
