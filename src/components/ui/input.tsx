import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
};

function Input({
  className,
  size = "default",
  unstyled = false,
  type,
  ...props
}: InputProps) {
  return (
    <span
      className={
        cn(
          !unstyled &&
            "relative inline-flex w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-field-default)] bg-clip-padding text-base/5 shadow-xs ring-[var(--border-active)]/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-[var(--accent-red-primary)]/64 has-focus-visible:has-aria-invalid:ring-[var(--accent-red-primary)]/16 has-aria-invalid:border-[var(--accent-red-primary)]/36 has-focus-visible:ring-[var(--accent-blue-primary)] has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-[var(--bg-l0-solid)] has-disabled:opacity-50 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
    >
      <input
        className={cn(
          "w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none placeholder:text-[var(--text-tertiary)]",
          size === "sm" &&
            "px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)]",
          size === "lg" && "py-[calc(--spacing(2)-1px)]",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "text-[var(--text-secondary)] file:me-3 file:bg-transparent file:font-medium file:text-[var(--text-primary)] file:text-sm",
        )}
        data-slot="input"
        type={type}
        {...props}
      />
    </span>
  );
}

export { Input, type InputProps };
