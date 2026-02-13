import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
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
          "bg-bg-emphasis text-fg-inverse [button,a&]:hover:bg-bg-emphasis/90",
        destructive:
          "bg-destructive text-fg-on-accent [button,a&]:hover:bg-destructive/90",
        error:
          "bg-destructive-muted text-destructive",
        info: "bg-accent-muted text-accent",
        outline:
          "border-border bg-transparent [button,a&]:hover:bg-bg-muted/50",
        secondary:
          "bg-bg-muted text-fg [button,a&]:hover:bg-bg-muted/90",
        success: "bg-success-muted text-success",
        warning: "bg-warning-muted text-warning",
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
