"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui-components/react/number-field";
import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const NumberFieldContext = React.createContext<{
  fieldId: string;
} | null>(null);

function NumberField({
  id,
  className,
  size = "default",
  ...props
}: NumberFieldPrimitive.Root.Props & {
  size?: "sm" | "default" | "lg";
}) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;

  return (
    <NumberFieldContext.Provider value={{ fieldId }}>
      <NumberFieldPrimitive.Root
        className={cn("flex w-full flex-col items-start gap-2", className)}
        data-size={size}
        data-slot="number-field"
        id={fieldId}
        {...props}
      />
    </NumberFieldContext.Provider>
  );
}

function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      className={cn(
        "relative flex w-full justify-between rounded-lg border border-slate-200 bg-white bg-clip-padding text-sm shadow-xs ring-slate-950/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-within:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-within:border-slate-950 focus-within:ring-[3px] has-aria-invalid:border-red-500/36 focus-within:has-aria-invalid:border-red-500/64 focus-within:has-aria-invalid:ring-red-500/48 data-disabled:pointer-events-none data-disabled:opacity-64 dark:bg-slate-200/32 dark:not-in-data-[slot=group]:bg-clip-border dark:has-aria-invalid:ring-red-500/24 dark:not-data-disabled:not-focus-within:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] [&:is([data-disabled],:focus-within,[aria-invalid])]:shadow-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:border-slate-800 dark:bg-slate-950 dark:ring-slate-300/24 dark:focus-within:border-slate-300 dark:has-aria-invalid:border-red-900/36 dark:focus-within:has-aria-invalid:border-red-900/64 dark:focus-within:has-aria-invalid:ring-red-900/48 dark:dark:bg-slate-800/32 dark:dark:has-aria-invalid:ring-red-900/24",
        className,
      )}
      data-slot="number-field-group"
      {...props}
    />
  );
}

function NumberFieldDecrement({
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center justify-center rounded-s-[calc(var(--radius-lg)-1px)] in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] px-[calc(--spacing(3)-1px)] transition-colors pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:bg-slate-100 dark:hover:bg-slate-800",
        className,
      )}
      data-slot="number-field-decrement"
      {...props}
    >
      <MinusIcon />
    </NumberFieldPrimitive.Decrement>
  );
}

function NumberFieldIncrement({
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center justify-center rounded-e-[calc(var(--radius-lg)-1px)] in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] px-[calc(--spacing(3)-1px)] transition-colors pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:bg-slate-100 dark:hover:bg-slate-800",
        className,
      )}
      data-slot="number-field-increment"
      {...props}
    >
      <PlusIcon />
    </NumberFieldPrimitive.Increment>
  );
}

function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      className={cn(
        "w-full min-w-0 flex-1 bg-transparent in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] px-[calc(--spacing(3)-1px)] in-data-[size=lg]:py-[calc(--spacing(2)-1px)] in-data-[size=sm]:py-[calc(--spacing(1)-1px)] py-[calc(--spacing(1.5)-1px)] text-center tabular-nums outline-none",
        className,
      )}
      data-slot="number-field-input"
      {...props}
    />
  );
}

function NumberFieldScrubArea({
  className,
  label,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props & {
  label: string;
}) {
  const context = React.useContext(NumberFieldContext);

  if (!context) {
    throw new Error(
      "NumberFieldScrubArea must be used within a NumberField component for accessibility.",
    );
  }

  return (
    <NumberFieldPrimitive.ScrubArea
      className={cn("flex cursor-ew-resize", className)}
      data-slot="number-field-scrub-area"
      {...props}
    >
      <Label className="cursor-ew-resize" htmlFor={context.fieldId}>
        {label}
      </Label>
      <NumberFieldPrimitive.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008] filter">
        <CursorGrowIcon />
      </NumberFieldPrimitive.ScrubAreaCursor>
    </NumberFieldPrimitive.ScrubArea>
  );
}

function CursorGrowIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="black"
      height="14"
      stroke="white"
      viewBox="0 24 14"
      width="26"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z" />
    </svg>
  );
}

export {
  NumberField,
  NumberFieldScrubArea,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldGroup,
  NumberFieldInput,
};
