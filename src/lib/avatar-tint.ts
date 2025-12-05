/**
 * Avatar tinting utilities for analyzing avatar colors and computing subtle tint overlays.
 * Based on Craft.do's avatar tinting system.
 */

export interface AvatarTintData {
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
 * Analyzes an avatar image to extract color data for tinting.
 * Downsamples the image to 32x32 for efficient analysis.
 */
export async function analyzeAvatarColors(
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




