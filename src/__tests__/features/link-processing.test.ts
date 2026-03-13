import {
  getInitialLinkProcessingStage,
  getInitialLinkProcessingState,
  getLinkProcessingStatus,
} from "@/features/links/lib/link-processing";

describe("link processing helpers", () => {
  it("queues async content types on create", () => {
    expect(getInitialLinkProcessingState("url")).toBe("queued");
    expect(getInitialLinkProcessingStage("image")).toBe("queued");
  });

  it("marks non-async content types as completed on create", () => {
    expect(getInitialLinkProcessingState("note")).toBe("completed");
    expect(getInitialLinkProcessingStage("color")).toBe("complete");
  });

  it("hides failed states from the badge UI", () => {
    expect(
      getLinkProcessingStatus({
        processing_state: "failed",
        processing_stage: "metadata",
        processing_error: "Metadata enrichment failed.",
      })
    ).toBeNull();
  });
});
