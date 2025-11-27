import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium text-sm outline-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        "icon-sm": "size-7 rounded-md",
        "icon-xl": "size-10 rounded-md [&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs": "size-6 rounded-md",
        lg: "min-h-9 px-3.5 py-2 text-base rounded-lg",
        sm: "min-h-7 gap-1.5 px-2.5 py-1 rounded-md",
        xl: "min-h-10 px-4 py-3 text-base rounded-xl [&_svg:not([class*='size-'])]:size-4.5",
        xs: "min-h-6 gap-1 px-2 py-1 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
      },
      variant: {
        default:
          "bg-[rgb(var(--skiff-black))] text-white hover:bg-[linear-gradient(0deg,rgba(var(--skiff-white),0.16),rgba(var(--skiff-white),0.16)),rgb(var(--skiff-black))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--skiff-black))] focus-visible:ring-offset-2",
        destructive:
          "bg-[rgb(var(--skiff-red-600))] text-white hover:bg-[rgb(var(--skiff-red-400))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--skiff-red-600))] focus-visible:ring-offset-2",
        "destructive-outline":
          "border border-[rgba(var(--skiff-red-400),0.12)] bg-transparent text-[rgb(var(--skiff-red-600))] hover:bg-[rgba(var(--skiff-red-400),0.12)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--skiff-red-600))] focus-visible:ring-offset-2",
        ghost: 
          "bg-transparent hover:bg-[rgba(var(--skiff-black),var(--skiff-opacity-8))] focus-visible:ring-2 focus-visible:ring-[rgba(var(--skiff-black),var(--skiff-opacity-12))] focus-visible:ring-offset-2",
        link: 
          "bg-transparent text-[rgb(var(--skiff-orange-500))] underline-offset-4 hover:underline hover:text-[rgb(var(--skiff-orange-600))]",
        outline:
          "border border-[var(--border-primary)] bg-white hover:bg-[rgba(var(--skiff-black),var(--skiff-opacity-4))] focus-visible:ring-2 focus-visible:ring-[var(--border-primary)] focus-visible:ring-offset-2",
        secondary:
          "bg-[rgba(var(--skiff-black),var(--skiff-opacity-4))] text-[var(--text-primary)] hover:bg-[rgba(var(--skiff-black),var(--skiff-opacity-8))] focus-visible:ring-2 focus-visible:ring-[var(--border-primary)] focus-visible:ring-offset-2",
      },
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
