import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-all duration-120 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] disabled:active:scale-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "min-h-8 px-3 py-1.5 rounded-md",
        icon: "size-8 rounded-md",
        "icon-lg": "size-9 rounded-md",
        "icon-pill": "size-8 rounded-full",
        "icon-pill-lg": "size-9 rounded-full",
        "icon-pill-sm": "size-7 rounded-full",
        "icon-pill-xl": "size-10 rounded-full [&_svg:not([class*='size-'])]:size-4.5",
        "icon-pill-xs": "size-6 rounded-full",
        "icon-sm": "size-7 rounded-md",
        "icon-xl": "size-10 rounded-md [&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs": "size-6 rounded-md",
        lg: "min-h-9 px-3.5 py-2 text-base rounded-lg",
        pill: "min-h-8 px-4 py-1.5 rounded-full",
        "pill-lg": "min-h-9 px-5 py-2 text-base rounded-full",
        "pill-sm": "min-h-7 gap-1.5 px-3 py-1 rounded-full",
        "pill-xl": "min-h-10 px-6 py-3 text-base rounded-full",
        "pill-xs": "min-h-6 gap-1 px-2.5 py-1 text-xs rounded-full",
        sm: "min-h-7 gap-1.5 px-2.5 py-1 rounded-md",
        xl: "min-h-10 px-4 py-3 text-base rounded-xl [&_svg:not([class*='size-'])]:size-4.5",
        xs: "min-h-6 gap-1 px-2 py-1 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
      },
      variant: {
        default:
          "bg-btn-primary text-fg-on-accent hover:bg-btn-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        neutral:
          "bg-btn-neutral text-fg-on-accent hover:bg-btn-neutral-hover focus-visible:ring-2 focus-visible:ring-border-emphasis focus-visible:ring-offset-2",
        destructive:
          "bg-transparent text-destructive hover:bg-destructive-muted focus-visible:ring-2 focus-visible:ring-border-destructive focus-visible:ring-offset-2",
        "destructive-outline":
          "border border-border-destructive bg-transparent text-destructive hover:bg-destructive-muted focus-visible:ring-2 focus-visible:ring-border-destructive focus-visible:ring-offset-2",
        "destructive-secondary":
          "bg-destructive-muted text-destructive hover:bg-destructive-muted focus-visible:ring-2 focus-visible:ring-border-destructive focus-visible:ring-offset-2",
        ghost:
          "bg-transparent hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-border-muted focus-visible:ring-offset-2",
        link:
          "bg-transparent text-accent underline-offset-4 hover:underline hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        outline:
          "bg-bg-surface hover:bg-bg-hover focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 shadow-sm",
        secondary:
          "bg-btn-secondary text-fg hover:bg-btn-secondary-hover focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2",
      },
    },
  },
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof BaseButton>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <BaseButton
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLElement>}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
