"use client";

import * as React from "react";
import { IconFileExport, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
}

export function SettingsExport() {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/exports/links/csv", {
        method: "GET",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to export links");
      }

      const blob = await response.blob();
      const filename =
        parseFilename(response.headers.get("content-disposition")) ||
        `cadie-links-active-${new Date().toISOString().replace(/[.:]/g, "-")}.csv`;

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast.success("CSV export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export links");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-fg">Export Active Links</h3>
        <p className="text-sm text-fg-muted">
          Download a CSV backup of all active links with full metadata and space mappings.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-bg-muted p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-fg">Scope: active links only</p>
          <p className="text-xs text-fg-subtle">
            Includes all current link fields plus space IDs and space names as JSON arrays.
          </p>
        </div>

        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <IconFileExport className="mr-2 h-4 w-4" />
              Export CSV
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
