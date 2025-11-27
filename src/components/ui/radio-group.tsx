"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-col gap-3", className)}
      data-slot="radio-group"
      {...props}
    />
  );
}

function Radio({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-field-default)] bg-clip-padding shadow-xs outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-full not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-[var(--border-active)] focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 aria-invalid:border-[var(--accent-red-primary)]/36 focus-visible:aria-invalid:border-[var(--accent-red-primary)]/64 focus-visible:aria-invalid:ring-[var(--accent-red-primary)]/48 [&:is(:disabled,[data-state=checked],[aria-invalid])]:shadow-none",
        className,
      )}
      data-slot="radio"
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="-inset-px absolute flex size-4 items-center justify-center rounded-full before:size-1.5 before:rounded-full before:bg-[var(--text-inverse)] data-[state=unchecked]:hidden data-[state=checked]:bg-[var(--cta-primary-default)]"
        data-slot="radio-indicator"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, Radio, Radio as RadioGroupItem };
