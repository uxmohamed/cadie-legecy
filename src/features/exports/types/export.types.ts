import type { Database } from "@/lib/supabase/types";

export type ExportScope = "active";

export type LinkRow = Database["public"]["Tables"]["links"]["Row"];

export interface LinkExportRow extends LinkRow {
  space_ids_json: string;
  space_names_json: string;
}

export interface ExportCsvResult {
  filename: string;
  generatedAt: string;
  rowCount: number;
  scope: ExportScope;
}
