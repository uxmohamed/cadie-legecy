import { Changelog } from "contentlayer/generated";

export type ChangelogEntry = Changelog;

export type ChangelogChangeType = "added" | "changed" | "fixed" | undefined;

