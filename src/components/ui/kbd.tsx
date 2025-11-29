import * as React from "react"

import { cn } from "@/lib/utils"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--kbd-bg)] text-[var(--overlay-text-secondary)]",
          className
        )}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
