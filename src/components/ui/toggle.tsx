"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 font-medium text-sm outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:bg-neutral-100/50 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-64 data-[state=on]:bg-neutral-100 data-[state=on]:text-neutral-900 data-[state=on]:transition-none dark:data-[state=on]:bg-neutral-200/80 dark:hover:bg-neutral-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:border-neutral-800 dark:hover:bg-neutral-800/50 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950 dark:data-[state=on]:bg-neutral-800 dark:data-[state=on]:text-neutral-50 dark:dark:data-[state=on]:bg-neutral-800/80 dark:dark:hover:bg-neutral-800",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-8 min-w-8 px-[calc(--spacing(2)-1px)]",
        lg: "h-9 min-w-9 px-[calc(--spacing(2.5)-1px)]",
        sm: "h-7 min-w-7 px-[calc(--spacing(1.5)-1px)]",
      },
      variant: {
        default: "border-transparent",
        outline:
          "border-neutral-200 bg-clip-padding shadow-xs not-disabled:not-active:not-data-[state=on]:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-neutral-200/32 dark:hover:bg-neutral-200/64 dark:not-disabled:not-active:not-data-[state=on]:before:shadow-[0_-1px_--theme(--color-white/8%)] dark:not-disabled:not-data-[state=on]:before:shadow-[0_-1px_--theme(--color-white/4%)] [&:is(:disabled,:active,[data-state=on])]:shadow-none dark:border-neutral-800 dark:dark:bg-neutral-800/32 dark:dark:hover:bg-neutral-800/64",
      },
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      className={cn(toggleVariants({ className, size, variant }))}
      data-slot="toggle"
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
