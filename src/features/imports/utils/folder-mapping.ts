import { SPACE_COLORS } from "@/features/spaces/constants/space-colors";
import type { FolderMode } from "@/features/imports/types/import.types";

const SPACE_COLOR_PALETTE = Object.values(SPACE_COLORS).map((color) => color.cssVar);

export function normalizeFolderMapKey(folderName: string): string {
  return folderName.trim().toLowerCase();
}

export function getDeterministicSpaceColor(folderName: string): string {
  const source = normalizeFolderMapKey(folderName);
  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }

  const paletteIndex = Math.abs(hash) % SPACE_COLOR_PALETTE.length;
  return SPACE_COLOR_PALETTE[paletteIndex];
}

interface ResolveDestinationArgs {
  folderMode: FolderMode;
  topLevelFolder: string | null;
  singleSpaceId: string | null;
  fallbackSpaceId: string | null;
  folderToSpaceMap: Record<string, string>;
  autoCreatedFolderToSpaceMap: Map<string, string>;
}

export function resolveDestinationSpaceId({
  folderMode,
  topLevelFolder,
  singleSpaceId,
  fallbackSpaceId,
  folderToSpaceMap,
  autoCreatedFolderToSpaceMap,
}: ResolveDestinationArgs): string | null {
  if (folderMode === "single_space") {
    return singleSpaceId || null;
  }

  if (folderMode === "manual_map") {
    if (!topLevelFolder) return fallbackSpaceId || null;

    const mapped = folderToSpaceMap[normalizeFolderMapKey(topLevelFolder)];
    return mapped || fallbackSpaceId || null;
  }

  if (!topLevelFolder) {
    return fallbackSpaceId || null;
  }

  const resolved = autoCreatedFolderToSpaceMap.get(normalizeFolderMapKey(topLevelFolder));
  return resolved || fallbackSpaceId || null;
}

