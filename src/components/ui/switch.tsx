"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group/switch inset-shadow-[0_1px_--theme(--color-black/4%)] inline-flex h-[1.125rem] w-7.5 shrink-0 items-center rounded-full p-px outline-none transition-all focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-neutral-200",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-[translate,width] group-active/switch:w-4.5 data-[state=checked]:tranneutral-x-3 data-[state=unchecked]:tranneutral-x-0 data-[state=checked]:group-active/switch:tranneutral-x-2.5",
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
