"use client";

import { SettingsImport } from "./settings-import";
import { SettingsExport } from "./settings-export";
import { Separator } from "@/components/ui/separator";

export function SettingsData() {
  return (
    <div className="space-y-6">
      <SettingsImport />
      <Separator />
      <SettingsExport />
    </div>
  );
}
