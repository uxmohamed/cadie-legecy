"use client";

import * as React from "react";

/**
 * Avatar tinting utilities for analyzing avatar colors and computing subtle tint overlays.
 * Based on Craft.do's avatar tinting system.
 */

interface AvatarTintData {
  r: number;
  g: number;
  b: number;
  opacity: number;
}

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Calculates a subtle tint color from average RGB values.
 * Heavily reduces chroma and applies saturation multiplier.
 */
function calculateTintColor(
  avgR: number,
  avgG: number,
  avgB: number,
  avgSaturation: number,
): AvatarTintData {
  // Convert to HSL for easier manipulation
  const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

  // Reduce chroma heavily by reducing saturation
  // Apply saturation multiplier (0.851923 from Craft.do)
  const reducedSaturation = s * 0.851923;

  // Convert back to RGB
  const tintRgb = hslToRgb(h, reducedSaturation, l);

  return {
    r: Math.round(tintRgb[0]),
    g: Math.round(tintRgb[1]),
    b: Math.round(tintRgb[2]),
    opacity: 0.0505246, // From Craft.do
  };
}

/**
 * Analyzes an avatar image to extract color data for tinting.
 * Downsamples the image to 32x32 for efficient analysis.
 */
async function analyzeAvatarColors(
  image: HTMLImageElement,
): Promise<AvatarTintData> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas to 32x32 for analysis
  canvas.width = 32;
  canvas.height = 32;

  // Draw image scaled to 32x32
  ctx.drawImage(image, 0, 0, 32, 32);

  // Read pixel data
  const imageData = ctx.getImageData(0, 0, 32, 32);
  const data = imageData.data;
  const pixelCount = 32 * 32;

  // Calculate average RGB values
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalSaturation = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip fully transparent pixels
    const a = data[i + 3];
    if (a === 0) continue;

    totalR += r;
    totalG += g;
    totalB += b;

    // Calculate saturation for this pixel
    const [, s] = rgbToHsl(r, g, b);
    totalSaturation += s;
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgSaturation = totalSaturation / pixelCount;

  // Calculate tint color with reduced chroma
  return calculateTintColor(avgR, avgG, avgB, avgSaturation);
}

interface BackgroundTintProps {
  avatarSrc?: string | null;
  children: React.ReactNode;
}

export function BackgroundTint({ avatarSrc, children }: BackgroundTintProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tintData, setTintData] = React.useState<AvatarTintData | null>(null);

  // Analyze avatar colors when avatar src changes
  React.useEffect(() => {
    if (!avatarSrc) {
      setTintData(null);
      return;
    }

    // Create image element to load the avatar
    const img = new Image();
    img.crossOrigin = "anonymous";

    const handleImageLoad = async () => {
      try {
        const data = await analyzeAvatarColors(img);
        setTintData(data);
      } catch (error) {
        console.error("Failed to analyze avatar colors:", error);
        setTintData(null);
      }
    };

    img.onload = handleImageLoad;
    img.onerror = () => {
      setTintData(null);
    };

    img.src = avatarSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [avatarSrc]);

  // Apply tint data as CSS variables
  React.useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    if (tintData) {
      container.style.setProperty("--background-tint-r", String(tintData.r));
      container.style.setProperty("--background-tint-g", String(tintData.g));
      container.style.setProperty("--background-tint-b", String(tintData.b));
      container.style.setProperty("--background-tint-opacity", String(tintData.opacity));
    } else {
      container.style.removeProperty("--background-tint-r");
      container.style.removeProperty("--background-tint-g");
      container.style.removeProperty("--background-tint-b");
      container.style.removeProperty("--background-tint-opacity");
    }
  }, [tintData]);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--bg-pure-white)" }}>
      {/* Background tint overlay - fixed to viewport */}
      {tintData && (
        <div
          ref={containerRef}
          className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none block"
          style={{
            opacity: 1,
            transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 0,
          }}
        >
          {/* Tint overlay inner div */}
          <div
            className="absolute top-0 left-0"
            style={{
              backgroundColor: `rgb(${tintData.r}, ${tintData.g}, ${tintData.b})`,
              opacity: tintData.opacity,
              filter: "saturate(0.851923)",
              mixBlendMode: "multiply",
              transitionProperty: "opacity, filter, transform",
              transitionDuration: "200ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              userSelect: "none",
              transform: "translate3d(0px, 0px, 0px)",
              width: "100vw",
              height: "100vh",
            }}
          />
        </div>
      )}

      {/* App content - positioned above tint */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
