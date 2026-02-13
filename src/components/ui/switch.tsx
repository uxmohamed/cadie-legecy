"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group/switch inline-flex h-[1.125rem] w-7.5 shrink-0 items-center rounded-full p-px outline-none transition-all focus-visible:ring-2 focus-visible:ring-border-emphasis focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 data-[state=checked]:bg-accent data-[state=unchecked]:bg-border-overlay",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-fg-on-overlay shadow-sm transition-[translate,width] group-active/switch:w-4.5 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 data-[state=checked]:group-active/switch:translate-x-2.5",
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
