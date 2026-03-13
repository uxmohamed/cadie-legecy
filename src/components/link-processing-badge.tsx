"use client";

import { Badge } from "@/components/ui/badge";
import type { Link } from "@/features/links/types";
import { getLinkProcessingStatus } from "@/features/links/lib/link-processing";

interface LinkProcessingBadgeProps {
  link: Pick<Link, "processing_state" | "processing_stage" | "processing_error">;
  className?: string;
}

export function LinkProcessingBadge({ link, className }: LinkProcessingBadgeProps) {
  const status = getLinkProcessingStatus(link);
  if (!status) {
    return null;
  }

  return (
    <Badge
      variant={status.variant}
      size="sm"
      className={className}
      title={status.title}
      aria-label={status.title}
    >
      {status.label}
    </Badge>
  );
}
