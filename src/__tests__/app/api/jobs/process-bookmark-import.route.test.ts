const mockVerify = jest.fn();
const mockProcessJob = jest.fn();
const mockClaimBackgroundJobExecution = jest.fn();
const mockGetQStashAttemptInfo = jest.fn();
const mockMarkBackgroundJobCompleted = jest.fn();
const mockSafeMarkBackgroundJobFailed = jest.fn();

jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    headers: Headers;
    private readonly bodyData: unknown;

    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.bodyData = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(data), {
        status: init?.status,
        headers: {
          ...(init?.headers || {}),
          "content-type": "application/json",
        },
      });
    }

    async json() {
      if (typeof this.bodyData === "string") {
        return JSON.parse(this.bodyData);
      }
      return this.bodyData;
    }
  }

  return {
    NextResponse: MockNextResponse,
  };
});

jest.mock("@upstash/qstash", () => ({
  Receiver: jest.fn().mockImplementation(() => ({
    verify: (...args: unknown[]) => mockVerify(...args),
  })),
}));

jest.mock("@/features/imports/services/bookmark-import.service", () => ({
  BookmarkImportService: jest.fn().mockImplementation(() => ({
    processJob: (...args: unknown[]) => mockProcessJob(...args),
  })),
}));

jest.mock("@/lib/background-job-executions", () => ({
  claimBackgroundJobExecution: (...args: unknown[]) => mockClaimBackgroundJobExecution(...args),
  getQStashAttemptInfo: (...args: unknown[]) => mockGetQStashAttemptInfo(...args),
  markBackgroundJobCompleted: (...args: unknown[]) => mockMarkBackgroundJobCompleted(...args),
  safeMarkBackgroundJobFailed: (...args: unknown[]) => mockSafeMarkBackgroundJobFailed(...args),
}));

import { POST } from "@/app/api/jobs/process-bookmark-import/route";

describe("POST /api/jobs/process-bookmark-import", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockResolvedValue(undefined);
    mockGetQStashAttemptInfo.mockReturnValue({
      attemptCount: 1,
      retryCount: 0,
      maxAttempts: 6,
      messageId: "msg-1",
    });
    mockMarkBackgroundJobCompleted.mockResolvedValue(true);
    mockSafeMarkBackgroundJobFailed.mockResolvedValue({
      terminal: false,
      persisted: true,
    });
  });

  function makeRequest(body: Record<string, unknown>) {
    return {
      headers: new Headers({ "upstash-signature": "sig" }),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    } as never;
  }

  it("skips duplicate deliveries without invoking the import service", async () => {
    mockClaimBackgroundJobExecution.mockResolvedValue({
      shouldProcess: false,
      duplicateState: "completed",
      invocationId: "inv-1",
    });

    const response = await POST(
      makeRequest({ importJobId: "job-1", userId: "user-1" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      skipped: true,
      reason: "completed",
      importJobId: "job-1",
    });
    expect(mockProcessJob).not.toHaveBeenCalled();
  });

  it("returns a terminal status after the last failed attempt", async () => {
    mockClaimBackgroundJobExecution.mockResolvedValue({
      shouldProcess: true,
      duplicateState: null,
      invocationId: "inv-1",
    });
    mockProcessJob.mockRejectedValue(new Error("import exploded"));
    mockSafeMarkBackgroundJobFailed.mockResolvedValue({
      terminal: true,
      persisted: true,
    });

    const response = await POST(
      makeRequest({ importJobId: "job-1", userId: "user-1" })
    );

    expect(response.status).toBe(489);
    await expect(response.json()).resolves.toEqual({
      error: "import exploded",
    });
    expect(mockSafeMarkBackgroundJobFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        invocationId: "inv-1",
        dedupeKey: "bookmark-import:user-1:job-1",
      })
    );
  });
});
