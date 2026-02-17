"use client";

import * as React from "react";
import { IconLoader2, IconUpload, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSpacesQuery } from "@/features/spaces/queries";
import { useImportJobQuery, useImportJobsQuery } from "@/features/imports/queries/use-import-jobs-query";
import type { BookmarkPreview, FolderMode, ImportJobDTO } from "@/features/imports/types/import.types";

interface PreviewResponse {
  job: ImportJobDTO;
  preview: BookmarkPreview;
}

interface JobResponse {
  job: ImportJobDTO;
}

export function SettingsImport() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<BookmarkPreview | null>(null);
  const [currentJobId, setCurrentJobId] = React.useState<string | null>(null);
  const [folderMode, setFolderMode] = React.useState<FolderMode>("single_space");
  const [singleSpaceId, setSingleSpaceId] = React.useState<string>("");
  const [fallbackSpaceId, setFallbackSpaceId] = React.useState<string>("");
  const [folderToSpaceMap, setFolderToSpaceMap] = React.useState<Record<string, string>>({});
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);

  const { spaces } = useSpacesQuery(true);
  const { jobs: recentJobs, refetch: refetchJobs } = useImportJobsQuery(10, true);
  const { job: currentJob } = useImportJobQuery(currentJobId, Boolean(currentJobId));

  React.useEffect(() => {
    if (currentJobId) return;
    const activeJob = recentJobs.find((job) => job.status === "queued" || job.status === "processing");
    if (activeJob) {
      setCurrentJobId(activeJob.id);
      setPreview({
        total_links: activeJob.preview_total_links,
        invalid_links: activeJob.preview_invalid_links,
        top_level_folders: activeJob.preview_top_folders,
        sample_links: activeJob.preview_sample_links,
      });
    }
  }, [currentJobId, recentJobs]);

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
      setFolderMode("single_space");
      setSingleSpaceId("");
      setFallbackSpaceId("");

      const initialMap: Record<string, string> = {};
      data.preview.top_level_folders.forEach((folder) => {
        initialMap[folder] = "";
      });
      setFolderToSpaceMap(initialMap);
      toast.success("Bookmark preview ready");
      await refetchJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview bookmark file");
    } finally {
      setIsPreviewing(false);
    }
  }, [selectedFile, refetchJobs]);

  const handleStartImport = React.useCallback(async () => {
    if (!currentJobId) {
      toast.error("Preview a bookmark file first");
      return;
    }

    setIsStarting(true);
    try {
      const payload = {
        folder_mode: folderMode,
        single_space_id: folderMode === "single_space" ? (singleSpaceId || null) : null,
        folder_to_space_map:
          folderMode === "manual_map"
            ? Object.fromEntries(
                Object.entries(folderToSpaceMap).filter(([, value]) => Boolean(value))
              )
            : {},
        fallback_space_id:
          folderMode === "manual_map" || folderMode === "auto_create_spaces"
            ? (fallbackSpaceId || null)
            : null,
      };

      const response = await fetch(`/api/imports/${currentJobId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as JobResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to start import");
      }

      setCurrentJobId(data.job.id);
      toast.success("Import started in the background");
      await refetchJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start import");
    } finally {
      setIsStarting(false);
    }
  }, [currentJobId, fallbackSpaceId, folderMode, folderToSpaceMap, refetchJobs, singleSpaceId]);

  const handleFolderSpaceChange = React.useCallback((folderName: string, value: string) => {
    setFolderToSpaceMap((prev) => ({
      ...prev,
      [folderName]: value,
    }));
  }, []);

  const isJobRunning = currentJob?.status === "queued" || currentJob?.status === "processing";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-fg">Import Browser Bookmarks</h3>
        <p className="text-sm text-fg-muted">
          Upload a bookmark HTML export from Chrome, Edge, Firefox, or Safari. Import runs in the
          background and continues even if you close settings.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-bg-muted p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bookmark-file">Bookmark HTML file</Label>
          <input
            ref={fileInputRef}
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
        <Button onClick={handlePreview} disabled={!selectedFile || isPreviewing}>
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

      {preview && (
        <div className="rounded-lg border border-border bg-bg-muted p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PreviewStat label="Links" value={preview.total_links} />
            <PreviewStat label="Invalid" value={preview.invalid_links} />
            <PreviewStat label="Folders" value={preview.top_level_folders.length} />
            <PreviewStat label="Sample" value={preview.sample_links.length} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="folder-mode">Folder handling</Label>
            <select
              id="folder-mode"
              value={folderMode}
              onChange={(event) => setFolderMode(event.target.value as FolderMode)}
              className="h-10 w-full rounded-md border border-border bg-bg-surface px-3 text-sm text-fg"
            >
              <option value="single_space">Import everything to one destination</option>
              <option value="manual_map">Map top-level folders to existing spaces</option>
              <option value="auto_create_spaces">Auto-create spaces from top-level folders</option>
            </select>
          </div>

          {folderMode === "single_space" && (
            <div className="space-y-2">
              <Label htmlFor="single-space">Destination space</Label>
              <select
                id="single-space"
                value={singleSpaceId}
                onChange={(event) => setSingleSpaceId(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg-surface px-3 text-sm text-fg"
              >
                <option value="">All items (no space)</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(folderMode === "manual_map" || folderMode === "auto_create_spaces") && (
            <div className="space-y-2">
              <Label htmlFor="fallback-space">Fallback destination</Label>
              <select
                id="fallback-space"
                value={fallbackSpaceId}
                onChange={(event) => setFallbackSpaceId(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg-surface px-3 text-sm text-fg"
              >
                <option value="">All items (no space)</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {folderMode === "manual_map" && preview.top_level_folders.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-fg-subtle">Top-level folder mapping</p>
              <div className="space-y-2">
                {preview.top_level_folders.map((folder) => (
                  <div key={folder} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                    <p className="text-sm text-fg">{folder}</p>
                    <select
                      value={folderToSpaceMap[folder] || ""}
                      onChange={(event) => handleFolderSpaceChange(folder, event.target.value)}
                      className="h-9 rounded-md border border-border bg-bg-surface px-3 text-sm text-fg"
                    >
                      <option value="">Use fallback</option>
                      {spaces.map((space) => (
                        <option key={space.id} value={space.id}>
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.sample_links.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-fg-subtle">Sample links</p>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium text-fg-subtle">Title</th>
                      <th className="px-3 py-2 font-medium text-fg-subtle">Folder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_links.map((link, index) => (
                      <tr key={`${link.url}-${index}`} className="border-t border-border">
                        <td className="px-3 py-2 text-fg">
                          <p className="truncate max-w-[320px]">{link.title}</p>
                          <p className="truncate text-fg-subtle">{link.url}</p>
                        </td>
                        <td className="px-3 py-2 text-fg-subtle">{link.topLevelFolder || "Root"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={handleStartImport} disabled={isStarting || isJobRunning}>
            {isStarting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : isJobRunning ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Import running...
              </>
            ) : (
              "Start Background Import"
            )}
          </Button>
        </div>
      )}

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
              Current import status: <span className="capitalize">{currentJob.status}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PreviewStat label="Processed" value={currentJob.processed_links} />
            <PreviewStat label="Created" value={currentJob.created_links} />
            <PreviewStat label="Restored" value={currentJob.restored_links} />
            <PreviewStat label="Duplicates" value={currentJob.duplicate_links} />
            <PreviewStat label="Invalid" value={currentJob.invalid_links} />
            <PreviewStat label="Attached" value={currentJob.space_attached_existing_links} />
          </div>

          {currentJob.error_message && (
            <p className="text-xs text-destructive">{currentJob.error_message}</p>
          )}
        </div>
      )}

      {recentJobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-fg-subtle">Recent imports</p>
          <div className="space-y-1">
            {recentJobs.map((job) => (
              <button
                type="button"
                key={job.id}
                onClick={() => {
                  setCurrentJobId(job.id);
                  setPreview({
                    total_links: job.preview_total_links,
                    invalid_links: job.preview_invalid_links,
                    top_level_folders: job.preview_top_folders,
                    sample_links: job.preview_sample_links,
                  });
                }}
                className="w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-left hover:bg-bg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-fg">{job.original_filename}</p>
                  <p className="text-[11px] capitalize text-fg-subtle">{job.status}</p>
                </div>
                <p className="text-[11px] text-fg-subtle">
                  {job.created_links} created · {job.restored_links} restored · {job.duplicate_links} duplicates
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
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

