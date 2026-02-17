import * as React from "react"

import { cn } from "@/lib/utils"

export type KbdProps = React.HTMLAttributes<HTMLElement>

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => {

    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-[570] font-mono tabular-nums tracking-[0.15em]",
          "[font-feature-settings:\"ss01\",\"ss02\",\"calt\",\"case\"]",
          "[--tw-ordinal:ordinal] [--tw-slashed-zero:slashed-zero] [--tw-numeric-figure:tabular-nums] [--tw-numeric-fraction:diagonal-fractions]",
          "bg-[var(--kbd-bg)] text-fg-on-overlay-muted",
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
