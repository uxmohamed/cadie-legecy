import * as React from "react"

import { cn } from "@/lib/utils"

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

// Keyboard modifier symbols that need scaling
const KEYBOARD_SYMBOLS = ['⇧', '⌘', '⌥', '⌃', '⌫', '⌦', '↑', '↓', '←', '→']

const processChildren = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') {
    return children.split('').map((char, index) => {
      if (KEYBOARD_SYMBOLS.includes(char)) {
        return (
          <span 
            key={index} 
            className="inline-block align-middle"
            style={{ transform: 'scale(1.4)', transformOrigin: 'center' }}
          >
            {char}
          </span>
        )
      }
      return char
    })
  }
  return children
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => {
    const processedChildren = React.useMemo(() => processChildren(children), [children])
    
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-[570] font-mono tabular-nums tracking-[0.15em] leading-none",
          "[font-feature-settings:\"ss01\",\"ss02\",\"calt\",\"case\"]",
          "[--tw-ordinal:ordinal] [--tw-slashed-zero:slashed-zero] [--tw-numeric-figure:tabular-nums] [--tw-numeric-fraction:diagonal-fractions]",
          "bg-[var(--kbd-bg)] text-[var(--overlay-text-secondary)]",
          className
        )}
        {...props}
      >
        {processedChildren}
      </kbd>
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
