import imageCompression from "browser-image-compression";
import {
  compressImage,
  validateImageFile,
  MAX_IMAGE_FILE_SIZE,
} from "@/features/links/services/image-upload.service";

jest.mock("browser-image-compression", () => jest.fn());

const mockedImageCompression = imageCompression as jest.MockedFunction<
  typeof imageCompression
>;

function makeFile(
  sizeBytes: number,
  name: string,
  type: string
): File {
  const chunk = new Uint8Array(sizeBytes);
  return new File([chunk], name, { type });
}

describe("image-upload.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects files over max pre-compression size", () => {
    const tooLarge = makeFile(MAX_IMAGE_FILE_SIZE + 1024, "large.jpg", "image/jpeg");
    const result = validateImageFile(tooLarge);
    expect(result).toContain("Maximum");
  });

  it("skips compression for non-compressible image types", async () => {
    const gif = makeFile(2 * 1024 * 1024, "anim.gif", "image/gif");
    const result = await compressImage(gif);
    expect(result).toBe(gif);
    expect(mockedImageCompression).not.toHaveBeenCalled();
  });

  it("prefers avif output for jpeg when encoder succeeds", async () => {
    const original = makeFile(2 * 1024 * 1024, "photo.jpg", "image/jpeg");
    const pass1 = makeFile(700 * 1024, "photo.avif", "image/avif");
    mockedImageCompression.mockResolvedValueOnce(pass1);

    const optimized = await compressImage(original);

    expect(mockedImageCompression).toHaveBeenCalledTimes(1);
    expect(mockedImageCompression.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        fileType: "image/avif",
        maxWidthOrHeight: 1920,
      })
    );
    expect(optimized.type).toBe("image/avif");
    expect(optimized.size).toBeLessThan(original.size);
    expect(optimized.name.endsWith(".avif")).toBe(true);
  });

  it("falls back to webp when avif encoding fails", async () => {
    const original = makeFile(2 * 1024 * 1024, "photo.jpg", "image/jpeg");
    const fallback = makeFile(760 * 1024, "photo.webp", "image/webp");

    mockedImageCompression
      .mockRejectedValueOnce(new Error("AVIF encode failed"))
      .mockResolvedValueOnce(fallback);

    const optimized = await compressImage(original);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        fileType: "image/avif",
      })
    );
    expect(mockedImageCompression.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        fileType: "image/webp",
      })
    );
    expect(optimized.type).toBe("image/webp");
    expect(optimized.size).toBeLessThan(original.size);
  });

  it("runs a second compression pass for oversized first result", async () => {
    const original = makeFile(4 * 1024 * 1024, "camera.jpg", "image/jpeg");
    const firstPass = makeFile(980 * 1024, "camera.avif", "image/avif");
    const secondPass = makeFile(620 * 1024, "camera.avif", "image/avif");

    mockedImageCompression
      .mockResolvedValueOnce(firstPass)
      .mockResolvedValueOnce(secondPass);

    const optimized = await compressImage(original);

    expect(mockedImageCompression).toHaveBeenCalledTimes(2);
    expect(mockedImageCompression.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        maxWidthOrHeight: 1600,
        fileType: "image/avif",
      })
    );
    expect(optimized.size).toBe(secondPass.size);
  });
});
