"use client";

import { Field as FieldPrimitive } from "@base-ui-components/react/field";
import { mergeProps } from "@base-ui-components/react/merge-props";
import type * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
};

function Textarea({
  className,
  size = "default",
  unstyled = false,
  ...props
}: TextareaProps) {
  return (
    <span
      className={
        cn(
          !unstyled &&
            "relative inline-flex w-full rounded-lg border border-slate-200 bg-white bg-clip-padding text-base shadow-xs ring-slate-950/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] has-focus-visible:has-aria-invalid:border-red-500/64 has-focus-visible:has-aria-invalid:ring-red-500/16 has-aria-invalid:border-red-500/36 has-focus-visible:border-slate-950 has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] sm:text-sm dark:bg-slate-200/32 dark:bg-clip-border dark:has-aria-invalid:ring-red-500/24 dark:not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-300/24 dark:has-focus-visible:has-aria-invalid:border-red-900/64 dark:has-focus-visible:has-aria-invalid:ring-red-900/16 dark:has-aria-invalid:border-red-900/36 dark:has-focus-visible:border-slate-300 dark:dark:bg-slate-800/32 dark:dark:has-aria-invalid:ring-red-900/24",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="textarea-control"
    >
      <FieldPrimitive.Control
        render={(defaultProps) => (
          <textarea
            className={cn(
              "field-sizing-content min-h-17.5 w-full rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none max-sm:min-h-20.5",
              size === "sm" &&
                "min-h-16.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] max-sm:min-h-19.5",
              size === "lg" &&
                "min-h-18.5 py-[calc(--spacing(2)-1px)] max-sm:min-h-21.5",
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, props)}
          />
        )}
      />
    </span>
  );
}

export { Textarea, type TextareaProps };
