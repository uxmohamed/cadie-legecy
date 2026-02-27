import { createClient } from "@/lib/supabase/client";
import { getUserDocumentCount } from "@/features/links/services/document-upload.service";
import { getUserImageCount } from "@/features/links/services/image-upload.service";

function makeCountClient(result: { count: number | null; error: { message: string } | null }) {
  const thirdEq = jest.fn().mockResolvedValue(result);
  const secondEq = jest.fn().mockReturnValue({ eq: thirdEq });
  const firstEq = jest.fn().mockReturnValue({ eq: secondEq });
  const select = jest.fn().mockReturnValue({ eq: firstEq });
  const from = jest.fn().mockReturnValue({ select });

  return { from };
}

describe("upload quota count services", () => {
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns image count when query succeeds", async () => {
    mockCreateClient.mockReturnValue(makeCountClient({ count: 27, error: null }) as never);

    await expect(getUserImageCount("user_1")).resolves.toBe(27);
  });

  it("throws when image count query fails", async () => {
    mockCreateClient.mockReturnValue(
      makeCountClient({ count: null, error: { message: "db timeout" } }) as never
    );

    await expect(getUserImageCount("user_1")).rejects.toThrow("Unable to verify image quota: db timeout");
  });

  it("returns document count when query succeeds", async () => {
    mockCreateClient.mockReturnValue(makeCountClient({ count: 11, error: null }) as never);

    await expect(getUserDocumentCount("user_1")).resolves.toBe(11);
  });

  it("throws when document count query fails", async () => {
    mockCreateClient.mockReturnValue(
      makeCountClient({ count: null, error: { message: "connection reset" } }) as never
    );

    await expect(getUserDocumentCount("user_1")).rejects.toThrow(
      "Unable to verify document quota: connection reset"
    );
  });
});
