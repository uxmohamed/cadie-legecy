import type { Link, LinkProcessingStage, LinkProcessingState } from "@/features/links/types";

export function shouldTrackLinkProcessing(contentType?: string | null): boolean {
  return contentType === "url" || contentType === "image" || contentType === "document";
}

export function getInitialLinkProcessingState(contentType?: string | null): LinkProcessingState {
  return shouldTrackLinkProcessing(contentType) ? "queued" : "completed";
}

export function getInitialLinkProcessingStage(contentType?: string | null): LinkProcessingStage {
  return shouldTrackLinkProcessing(contentType) ? "queued" : "complete";
}

export function getLinkProcessingStatus(link: Pick<Link, "processing_state" | "processing_stage" | "processing_error">): {
  label: string;
  title: string;
  variant: "secondary" | "warning" | "error" | "success";
} | null {
  const state = link.processing_state;
  if (!state || state === "completed") {
    return null;
  }

  if (state === "failed") {
    return null;
  }

  if (state === "queued") {
    return {
      label: "Queued",
      title: "Background processing is queued.",
      variant: "warning",
    };
  }

  const stageLabel = formatStageLabel(link.processing_stage);
  return {
    label: stageLabel ? `${stageLabel}...` : "Processing...",
    title: stageLabel ? `${stageLabel} is in progress.` : "Background processing is in progress.",
    variant: "secondary",
  };
}

function formatStageLabel(stage?: LinkProcessingStage | null): string | null {
  switch (stage) {
    case "enrichment_queue":
      return "Queueing";
    case "metadata":
      return "Enriching";
    case "ai_tagging":
      return "Tagging";
    case "ai_vision_tagging":
      return "Analyzing image";
    case "extension_recovery":
      return "Recovering";
    case "queued":
      return "Queued";
    default:
      return null;
  }
}

export async function updateLinkProcessingState(
  client: {
    from: (table: "links") => {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => unknown;
        };
      };
    };
  },
  params: {
    linkId: string;
    userId: string;
    state: LinkProcessingState;
    stage: LinkProcessingStage;
    error?: string | null;
  }
): Promise<void> {
  const result = await (client
    .from("links")
    .update({
      processing_state: params.state,
      processing_stage: params.stage,
      processing_error: params.error ?? null,
    })
    .eq("id", params.linkId)
    .eq("user_id", params.userId) as Promise<{ error: { message: string } | null }>);

  const { error } = result;

  if (error) {
    throw new Error(error.message);
  }
}
