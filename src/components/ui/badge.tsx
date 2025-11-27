import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-[var(--border-primary)] border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "px-[calc(--spacing(1)-1px)] text-xs",
        lg: "px-[calc(--spacing(1.5)-1px)] text-sm",
        sm: "rounded-[calc(var(--radius-sm)-2px)] px-[calc(--spacing(1)-1px)] text-[.625rem]",
      },
      variant: {
        default:
          "bg-[var(--bg-emphasis)] text-[var(--text-inverse)] [button,a&]:hover:bg-[var(--bg-emphasis)]/90",
        destructive:
          "bg-[var(--accent-red-primary)] text-[var(--text-inverse)] [button,a&]:hover:bg-[var(--accent-red-primary)]/90",
        error:
          "bg-[var(--accent-error-bg)] text-[var(--accent-error-fg)]",
        info: "bg-[var(--accent-info-bg)] text-[var(--accent-info-fg)]",
        outline:
          "border-[var(--border-primary)] bg-transparent [button,a&]:hover:bg-[var(--bg-l0-solid)]/50",
        secondary:
          "bg-[var(--bg-l0-solid)] text-[var(--text-primary)] [button,a&]:hover:bg-[var(--bg-l0-solid)]/90",
        success: "bg-[var(--accent-success-bg)] text-[var(--accent-success-fg)]",
        warning: "bg-[var(--accent-yellow-secondary)] text-[var(--accent-yellow-primary)]",
      },
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ className, size, variant }))}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
