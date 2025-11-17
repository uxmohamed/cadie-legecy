"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui-components/react/scroll-area";

import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  orientation,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  orientation?: "horizontal" | "vertical" | "both";
}) {
  return (
    <ScrollAreaPrimitive.Root className="min-h-0" {...props}>
      <ScrollAreaPrimitive.Viewport
        className={cn(
          "size-full overscroll-contain rounded-[inherit] outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950",
          className,
        )}
        data-slot="scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation === "both" ? (
        <>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </>
      ) : (
        <ScrollBar orientation={orientation} />
      )}
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "m-0.5 flex opacity-0 transition-opacity delay-300 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100 data-hovering:delay-0 data-scrolling:delay-0 data-hovering:duration-100 data-scrolling:duration-100",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-slate-950/20 dark:bg-slate-50/20"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
