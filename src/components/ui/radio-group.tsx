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
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white bg-clip-padding shadow-xs outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-full not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 aria-invalid:border-red-500/36 focus-visible:aria-invalid:border-red-500/64 focus-visible:aria-invalid:ring-red-500/48 dark:not-data-[state=checked]:bg-slate-200/32 dark:bg-clip-border dark:aria-invalid:ring-red-500/24 dark:not-disabled:not-data-[state=checked]:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)] [&:is(:disabled,[data-state=checked],[aria-invalid])]:shadow-none dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950 dark:aria-invalid:border-red-900/36 dark:focus-visible:aria-invalid:border-red-900/64 dark:focus-visible:aria-invalid:ring-red-900/48 dark:dark:not-data-[state=checked]:bg-slate-800/32 dark:dark:aria-invalid:ring-red-900/24",
        className,
      )}
      data-slot="radio"
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="-inset-px absolute flex size-4 items-center justify-center rounded-full before:size-1.5 before:rounded-full before:bg-slate-50 data-[state=unchecked]:hidden data-[state=checked]:bg-slate-900 dark:before:bg-slate-900 dark:data-[state=checked]:bg-slate-50"
        data-slot="radio-indicator"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, Radio, Radio as RadioGroupItem };
