import { primitives } from "./primitives";

export type ThemeMode = 'light' | 'dark';

export const getSemanticTokens = (mode: ThemeMode = 'light') => {
  const p = primitives;

  // Helper for color-mix to keep things clean
  const mix = (color: string, percent: number, bg: string = "transparent") => 
    `color-mix(in oklab, ${color} ${percent}%, ${bg} ${100 - percent}%)`;

  // Determine if we're in light mode
  const isLight = mode === 'light';

  // Main app background - SINGLE SOURCE OF TRUTH
  // Update this value to change the app background for both light and dark modes
  // Both bg-main-container and bg-l0-solid use this value
  // Light mode: white with 2% black (same as bg-l1-solid)
  // Dark mode: black with 10% white (same as bg-l1-solid)
  const mainAppBackground = isLight ? mix(p.base.black, 2, p.base.white) : mix(p.base.white, 10, p.base.black);

  const colors = {
    // Base
    white: p.base.white,
    black: p.base.black,
    
    // Text (adapts to theme)
    "text-primary": isLight ? p.base.black : p.base.white,
    "text-secondary": isLight ? mix(p.base.black, 57) : mix(p.base.white, 60),
    "text-tertiary": isLight ? mix(p.base.black, 44) : mix(p.base.white, 56),
    "text-disabled": isLight ? mix(p.base.black, 34) : mix(p.base.white, 27),
    "text-link": p.caddy[5],
    "text-destructive": isLight ? p.red[600] : p.red[400],
    "text-inverse": isLight ? p.base.white : p.base.black,
    "text-always-white": p.base.white,
    "text-always-black": p.base.black,

    // Icons (adapts to theme)
    "icon-primary": isLight ? p.base.black : p.base.white,
    "icon-secondary": p.grey[500],
    "icon-tertiary": isLight ? p.grey[600] : p.grey[500],
    "icon-disabled": isLight ? p.grey[700] : p.grey[600],
    "icon-link": p.caddy[5],
    "icon-destructive": isLight ? p.red[600] : p.red[400],
    "icon-inverse": isLight ? p.base.white : p.base.black,
    "icon-always-white": p.base.white,
    "icon-always-black": p.base.black,

    // CTA (Buttons) - adapts to theme
    "cta-primary-default": p.caddy[5],
    "cta-primary-hover": p.caddy[4],
    "cta-primary-active": p.caddy[3],
    "cta-primary-disabled": isLight ? mix(p.caddy[5], 32) : mix(p.caddy[5], 32),

    "cta-neutral-default": p.grey[800],
    "cta-neutral-hover": p.grey[900],
    "cta-neutral-active": p.grey[800],
    "cta-neutral-disabled": isLight ? mix(p.grey[800], 32) : mix(p.grey[800], 32),

    "cta-secondary-default": isLight ? p.base.white : mix(p.base.white, 8),
    "cta-secondary-hover": isLight ? mix(p.base.black, 4) : mix(p.base.white, 12),
    "cta-secondary-active": isLight ? mix(p.base.black, 8, p.base.white) : mix(p.base.white, 12),
    "cta-secondary-disabled": "transparent",

    "cta-tertiary-default": "transparent",
    "cta-tertiary-hover": isLight ? mix(p.base.black, 6) : mix(p.base.white, 8),
    "cta-tertiary-active": isLight ? mix(p.base.black, 8) : mix(p.base.white, 12),
    "cta-tertiary-disabled": "transparent",

    "cta-destructive-default": "transparent",
    "cta-destructive-hover": isLight ? mix(p.red[600], 8) : mix(p.red[400], 8),
    "cta-destructive-active": mix(p.red[600], 12),
    "cta-destructive-disabled": "transparent",

    // Borders (adapts to theme)
    "border-primary": isLight ? mix(p.base.black, 12) : mix(p.base.white, 12),
    "border-secondary": isLight ? mix(p.base.black, 8) : mix(p.base.white, 8),
    "border-tertiary": isLight ? mix(p.base.black, 4) : mix(p.base.white, 4),
    "border-hover": isLight ? mix(p.base.black, 48) : mix(p.base.white, 32),
    "border-active": isLight ? p.base.black : p.base.white,
    "border-destructive": isLight ? mix(p.red[600], 12) : mix(p.red[400], 12),

    // Backgrounds (adapts to theme)
    // Main app background - SINGLE SOURCE OF TRUTH (defined above)
    // Both bg-main-container and bg-l0-solid use mainAppBackground
    "bg-main-container": mainAppBackground,
    "bg-sidepanel": isLight ? mix(p.base.black, 4, p.base.white) : p.grey[800],
    
    // Layered backgrounds (adapts to theme)
    // bg-l0-solid references the main app background (single source of truth)
    "bg-l0-solid": mainAppBackground,
    "bg-l0-glass": isLight ? mix(p.grey[100], 72) : mix(p.grey[900], 72),
    
    "bg-l1-solid": isLight ? mix(p.base.black, 2, p.base.white) : mix(p.base.white, 12, p.base.black),
    "bg-l1-glass": isLight ? mix(p.base.white, 72) : mix(p.grey[800], 72),
      
    "bg-l2-solid": isLight ? p.base.white : mix(p.base.white, 12, p.base.black),
    "bg-l2-glass": isLight ? mix(p.base.white, 72) : mix(p.grey[800], 72),
      
    "bg-l3-solid": isLight ? p.base.white : mix(p.base.white, 14, p.base.black),
    "bg-l3-glass": isLight ? mix(p.base.white, 72) : mix(p.grey[700], 72),

    "bg-emphasis": isLight ? mix(p.base.black, 16, p.base.white) : p.grey[800],
    "bg-inverse": isLight ? p.base.black : p.base.white,
    "bg-scrim": isLight ? mix(p.base.white, 80) : mix(p.base.black, 42),
      
    "bg-cell-hover": isLight ? mix(p.base.black, 6) : mix(p.base.white, 8),
    "bg-cell-active": isLight ? mix(p.base.black, 8) : mix(p.base.white, 12),

    "bg-field-default": isLight ? mix(p.base.black, 6) : mix(p.base.white, 8),
    "bg-field-light": isLight ? "color-mix(in oklab, oklch(0 0 0) 4%, transparent 94%)" : mix(p.base.white, 6),
    "bg-field-hover": isLight ? mix(p.base.black, 8) : mix(p.base.white, 12),

    // Overlays (adapts to theme)
    "bg-overlay-primary": isLight ? mix(p.base.black, 10) : mix(p.base.white, 10),
    "bg-overlay-secondary": isLight ? mix(p.base.black, 8) : mix(p.base.white, 8),
    "bg-overlay-tertiary": isLight ? mix(p.base.black, 4) : mix(p.base.white, 4),
    "bg-overlay-quaternary": isLight ? mix(p.base.black, 2) : mix(p.base.white, 2),
    "bg-overlay-destructive": mix(p.red[400], 24),

    // Overlay-specific tokens (always dark for dropdowns, menus, tooltips)
    "overlay-bg": p.grey[900],
    "overlay-text-primary": p.base.white,
    "overlay-text-secondary": mix(p.base.white, 56),
    "overlay-border": mix(p.base.white, 16),
    "overlay-hover": mix(p.base.white, 12),
    "overlay-separator": mix(p.base.white, 12),

    "bg-code-gutter": `linear-gradient(90deg, ${p.grey[300]} 1px, ${p.grey[100]} 1px)`,

    // Accents

    "accent-green-primary": p.green[500],
    "accent-green-secondary": mix(p.green[400], 28),

    "accent-yellow-primary": p.yellow[500],
    "accent-yellow-secondary": mix(p.yellow[400], 48),
    "accent-blue-primary": p.caddy[5],
    "accent-blue-secondary": mix(p.caddy[4], 36),
    "accent-red-primary": p.red[600],
    "accent-red-secondary": mix(p.red[400], 36),

    // Extension Specific (Legacy/Compat)
    "accent-success-bg": p.green[100],
    "accent-success-fg": p.green[700],
    "accent-success-border": p.green[200],

    "accent-error-bg": p.red[100],
    "accent-error-fg": p.red[700],
    "accent-error-border": p.red[200],

    "accent-info-bg": p.caddy[9],
    "accent-info-fg": p.caddy[1],
    "accent-info-border": p.caddy[8],

    "button-primary-bg": isLight ? p.base.black : p.base.white,
    "button-primary-bg-hover": isLight ? mix(p.base.black, 84, p.base.white) : mix(p.base.white, 84, p.base.black),
    
    "button-secondary-bg": isLight ? p.base.white : p.grey[800],
    "button-secondary-border": isLight ? mix(p.base.black, 12) : mix(p.base.white, 16),


    // Shadows
    "shadow-l1": "0px 1px 3px oklch(0 0 0 / 0.1), 0px 0px 2px oklch(0 0 0 / 0.06)",
    "shadow-l2": "0px 10px 15px -3px oklch(0 0 0 / 0.1), 0px 4px 6px -2px oklch(0 0 0 / 0.05)",
    "shadow-l3": "0px 25px 50px -12px oklch(0 0 0 / 0.25)",
    
    // Overlay Blur (Glassmorphic overlay with backdrop blur)
    "overlay-blur-bg": isLight 
      ? "linear-gradient(180deg, rgba(25, 25, 25, 0.50) 0%, rgba(2, 2, 2, 0.50) 100%), rgba(2, 2, 2, 0.80)"
      : "linear-gradient(180deg, rgba(64, 64, 64, 0.50) 0%, rgba(40, 40, 40, 0.50) 100%), rgba(40, 40, 40, 0.80)",
    "overlay-blur-shadow": "0 0 1px 0 rgba(0, 0, 0, 0.40), 0 0 1.5px 0 rgba(0, 0, 0, 0.30), 0 7px 22px 0 rgba(0, 0, 0, 0.25)",
    "overlay-blur-backdrop": "blur(13.5px)",
    
    // Keyboard shortcut background
    "kbd-bg": isLight ? "rgba(26, 26, 26, 0.06)" : "rgba(255, 255, 255, 0.06)",
      
    // Misc (adapts to theme)
    "scrollbar-active-gray": isLight ? p.grey[300] : p.grey[600],
    "scrollbar-inactive-gray": isLight ? mix(p.grey[300], 50) : mix(p.grey[600], 50),
    "scrollbar-hover-gray": isLight ? mix(p.grey[300], 70) : mix(p.grey[600], 70),
  };

  return colors;
};
