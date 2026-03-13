const mockCreateAdminClient = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}));

import {
  claimBackgroundJobExecution,
  markBackgroundJobCompleted,
  markBackgroundJobFailed,
} from "@/lib/background-job-executions";

describe("background job executions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.crypto, "randomUUID").mockReturnValue("invocation-1");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the claiming invocation id for a processing claim", async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: "exec-1",
        job_type: "metadata_enrichment",
        dedupe_key: "metadata:user-1:link-1",
        status: "processing",
        attempt_count: 1,
        max_attempts: 4,
        active_invocation_id: "invocation-1",
        last_error: null,
        last_payload: {},
        last_received_at: "2026-03-13T12:00:00.000Z",
        started_at: "2026-03-13T12:00:00.000Z",
        completed_at: null,
        terminal_failed_at: null,
        created_at: "2026-03-13T12:00:00.000Z",
        updated_at: "2026-03-13T12:00:00.000Z",
      },
      error: null,
    });

    mockCreateAdminClient.mockReturnValue({
      rpc: jest.fn().mockReturnValue({ single }),
    });

    const result = await claimBackgroundJobExecution({
      jobType: "metadata_enrichment",
      dedupeKey: "metadata:user-1:link-1",
      payload: { linkId: "link-1" },
      attemptCount: 1,
      maxAttempts: 4,
    });

    expect(result.shouldProcess).toBe(true);
    expect(result.invocationId).toBe("invocation-1");
    expect(result.duplicateState).toBeNull();
  });

  it("only marks completion when the active invocation still owns the job", async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    });

    const completed = await markBackgroundJobCompleted({
      jobType: "ai_tagging",
      dedupeKey: "ai-tags:user-1:link-1",
      invocationId: "invocation-1",
    });

    expect(completed).toBe(false);
    expect(query.eq).toHaveBeenCalledWith("active_invocation_id", "invocation-1");
    expect(query.eq).toHaveBeenCalledWith("status", "processing");
  });

  it("persists terminal failure only for the claiming invocation", async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: "exec-1" }, error: null }),
    };

    mockCreateAdminClient.mockReturnValue({
      from: jest.fn().mockReturnValue(query),
    });

    const result = await markBackgroundJobFailed({
      jobType: "bookmark_import_processing",
      dedupeKey: "bookmark-import:user-1:job-1",
      invocationId: "invocation-1",
      attemptCount: 6,
      maxAttempts: 6,
      error: new Error("boom"),
    });

    expect(result).toEqual({ terminal: true, persisted: true });
    expect(query.eq).toHaveBeenCalledWith("active_invocation_id", "invocation-1");
    expect(query.eq).toHaveBeenCalledWith("status", "processing");
  });
});
