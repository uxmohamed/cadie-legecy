"use client";

import * as React from "react";
import { IconLoader2, IconUpload, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportJobQuery } from "@/features/imports/queries/use-import-jobs-query";
import type { BookmarkPreview, ImportJobDTO } from "@/features/imports/types/import.types";

interface PreviewResponse {
  job: ImportJobDTO;
  preview: BookmarkPreview;
}

interface JobResponse {
  job: ImportJobDTO;
}

export function SettingsImport() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<BookmarkPreview | null>(null);
  const [currentJobId, setCurrentJobId] = React.useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const { job: currentJob } = useImportJobQuery(currentJobId, Boolean(currentJobId));

  const handleSelectFile = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }, []);

  const handlePreview = React.useCallback(async () => {
    if (!selectedFile) {
      toast.error("Choose a bookmark HTML file first");
      return;
    }

    setIsPreviewing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/imports/bookmarks/preview", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as PreviewResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse bookmark file");
      }

      setPreview(data.preview);
      setCurrentJobId(data.job.id);
      setIsPreviewOpen(true);
      toast.success("Bookmark preview ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview bookmark file");
    } finally {
      setIsPreviewing(false);
    }
  }, [selectedFile]);

  const handleStartImport = React.useCallback(async () => {
    if (!currentJobId) {
      toast.error("Preview a bookmark file first");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch(`/api/imports/${currentJobId}/start`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => ({}))) as JobResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to start import");
      }

      setCurrentJobId(data.job.id);
      setIsPreviewOpen(false);
      toast.success("Import started in the background");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start import");
    } finally {
      setIsStarting(false);
    }
  }, [currentJobId]);

  const isJobRunning = currentJob?.status === "queued" || currentJob?.status === "processing";
  const total = currentJob?.preview_total_links || preview?.total_links || 0;
  const processed = currentJob?.processed_links || 0;
  const progressPercent =
    currentJob?.status === "completed"
      ? 100
      : total > 0
        ? Math.max(0, Math.min(100, Math.round((processed / total) * 100)))
        : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-fg">Import Browser Bookmarks</h3>
        <p className="text-sm text-fg-muted">
          Upload bookmark HTML, preview links, then run import in background.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-bg-muted p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bookmark-file">Bookmark HTML file</Label>
          <input
            id="bookmark-file"
            type="file"
            accept=".html,.htm,text/html,text/plain"
            onChange={handleSelectFile}
            className="block w-full text-sm text-fg-muted file:mr-4 file:rounded-md file:border-0 file:bg-bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-fg hover:file:bg-bg"
          />
          {selectedFile && (
            <p className="text-xs text-fg-subtle">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>

        <Button onClick={handlePreview} disabled={!selectedFile || isPreviewing || isJobRunning}>
          {isPreviewing ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing preview...
            </>
          ) : (
            <>
              <IconUpload className="mr-2 h-4 w-4" />
              Preview Import
            </>
          )}
        </Button>
      </div>

      {currentJob && (
        <div className="rounded-lg border border-border bg-bg-muted p-4 space-y-3">
          <div className="flex items-center gap-2">
            {currentJob.status === "completed" ? (
              <IconCircleCheck className="h-4 w-4 text-emerald-500" />
            ) : currentJob.status === "failed" ? (
              <IconAlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <IconLoader2 className="h-4 w-4 animate-spin text-fg-muted" />
            )}
            <p className="text-sm font-medium text-fg">
              Import status: <span className="capitalize">{currentJob.status}</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-fg-subtle">
              <span>{processed} / {total} processed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-bg-surface">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {currentJob.error_message && (
            <p className="text-xs text-destructive">{currentJob.error_message}</p>
          )}
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import preview</DialogTitle>
            <DialogDescription>
              Review link count and sample, then start background import.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <PreviewStat label="Links" value={preview.total_links} />
                <PreviewStat label="Invalid" value={preview.invalid_links} />
                <PreviewStat label="Sample" value={preview.sample_links.length} />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-bg-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium text-fg-subtle">Title</th>
                      <th className="px-3 py-2 font-medium text-fg-subtle">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_links.map((link, index) => (
                      <tr key={`${link.url}-${index}`} className="border-t border-border">
                        <td className="px-3 py-2 text-fg">{link.title}</td>
                        <td className="px-3 py-2 text-fg-subtle">
                          <p className="truncate max-w-[360px]">{link.url}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button onClick={handleStartImport} disabled={isStarting || isJobRunning}>
                {isStarting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Background Import"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="text-sm font-medium text-fg">{value}</p>
    </div>
  );
}
