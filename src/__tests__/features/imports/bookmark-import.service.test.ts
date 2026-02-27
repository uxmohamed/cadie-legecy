import { BookmarkImportService } from "@/features/imports/services/bookmark-import.service";
import { createAdminClient } from "@/lib/supabase/server";

jest.mock("@/lib/job-queue", () => ({
  enqueueBatchAITagging: jest.fn(),
  enqueueBatchMetadataEnrichment: jest.fn(),
  enqueueBookmarkImportProcessing: jest.fn(),
}));

describe("BookmarkImportService.cleanupStaleJobs", () => {
  const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes files only for drafts that were actually marked expired", async () => {
    const remove = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ name: "user_1/job_1/bookmarks.html" }], error: null });

    const selectDrafts = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        lt: jest.fn().mockResolvedValue({
          data: [
            { id: "job_1", storage_path: "user_1/job_1/bookmarks.html" },
            { id: "job_2", storage_path: "user_1/job_2/bookmarks.html" },
          ],
          error: null,
        }),
      }),
    });

    const selectTerminal = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        lt: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const select = jest.fn((columns: string) => {
      if (columns === "id, storage_path") return selectDrafts();
      if (columns === "storage_path") return selectTerminal();
      throw new Error(`Unexpected select columns: ${columns}`);
    });

    const update = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: "job_1", storage_path: "user_1/job_1/bookmarks.html" }],
            error: null,
          }),
        }),
      }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table !== "bookmark_import_jobs") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return { select, update };
      }),
      storage: {
        from: jest.fn((bucket: string) => {
          if (bucket !== "imports") {
            throw new Error(`Unexpected bucket: ${bucket}`);
          }
          return { remove };
        }),
      },
    } as never);

    const service = new BookmarkImportService();
    const result = await service.cleanupStaleJobs();

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(["user_1/job_1/bookmarks.html"]);
    expect(result).toEqual({ expiredDrafts: 1, removedFiles: 1 });
  });

  it("does not delete draft files when no rows were updated to expired", async () => {
    const remove = jest.fn();

    const selectDrafts = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        lt: jest.fn().mockResolvedValue({
          data: [{ id: "job_2", storage_path: "user_1/job_2/bookmarks.html" }],
          error: null,
        }),
      }),
    });

    const selectTerminal = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        lt: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const select = jest.fn((columns: string) => {
      if (columns === "id, storage_path") return selectDrafts();
      if (columns === "storage_path") return selectTerminal();
      throw new Error(`Unexpected select columns: ${columns}`);
    });

    const update = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table !== "bookmark_import_jobs") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return { select, update };
      }),
      storage: {
        from: jest.fn(() => ({ remove })),
      },
    } as never);

    const service = new BookmarkImportService();
    const result = await service.cleanupStaleJobs();

    expect(remove).not.toHaveBeenCalled();
    expect(result).toEqual({ expiredDrafts: 0, removedFiles: 0 });
  });
});
