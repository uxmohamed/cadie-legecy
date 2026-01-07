// UI-only store for ephemeral state (selection, etc.)
export { useUIStore, clearUIStore } from "./ui-store";

// Legacy store - deprecated, will be removed
// Only kept for backwards compatibility during migration
export { useLinksStore, selectLinksForView, clearLinksStore } from "./links-store";
