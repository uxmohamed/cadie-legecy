"use client";

import { Switch as SwitchPrimitive } from "@base-ui-components/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group/switch inset-shadow-[0_1px_--theme(--color-black/4%)] inline-flex h-[1.125rem] w-7.5 shrink-0 items-center rounded-full p-px outline-none transition-all focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-64 data-checked:bg-slate-900 data-unchecked:bg-slate-200 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950 dark:data-checked:bg-slate-50 dark:data-unchecked:bg-slate-800",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-[translate,width] group-active/switch:w-4.5 data-checked:translate-x-3 data-unchecked:translate-x-0 data-checked:group-active/switch:translate-x-2.5 dark:bg-slate-950",
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
