import type { SmartSearchChip } from "@/features/search/types/smart-search.types";

function encodeBase64Url(value: string): string {
  if (
    typeof window !== "undefined" &&
    typeof btoa === "function" &&
    typeof TextEncoder !== "undefined"
  ) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  if (
    typeof window !== "undefined" &&
    typeof atob === "function" &&
    typeof TextDecoder !== "undefined"
  ) {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidChip(value: unknown): value is SmartSearchChip {
  if (!value || typeof value !== "object") return false;
  const chip = value as Record<string, unknown>;

  if (typeof chip.id !== "string" || typeof chip.kind !== "string" || typeof chip.label !== "string") {
    return false;
  }

  if (chip.kind === "date") {
    if (typeof chip.preset !== "string") return false;
    return true;
  }

  if (chip.kind === "source") {
    return typeof chip.sourceId === "string" && isStringArray(chip.domains);
  }

  if (chip.kind === "content_type") {
    return typeof chip.value === "string";
  }

  if (chip.kind === "space") {
    return typeof chip.spaceId === "string";
  }

  if (chip.kind === "keyword") {
    return typeof chip.term === "string";
  }

  return false;
}

export function encodeSmartChips(chips: SmartSearchChip[]): string | null {
  if (!chips.length) return null;

  try {
    return encodeBase64Url(JSON.stringify(chips));
  } catch {
    return null;
  }
}

export function decodeSmartChips(encoded: string | null): SmartSearchChip[] {
  if (!encoded) return [];

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded));
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidChip);
  } catch {
    return [];
  }
}
