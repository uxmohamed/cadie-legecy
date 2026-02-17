"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider> & {
  delayDuration?: number;
};

function TooltipProvider({ delayDuration, delay, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay ?? delayDuration} {...props} />;
}

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipPopupProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>["align"];
  side?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>["side"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>["sideOffset"];
  showArrow?: boolean;
};

const TooltipPopup = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Popup>,
  TooltipPopupProps
>(({ className, align = "center", side, sideOffset = 4, showArrow = true, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      positionMethod="fixed"
      className="z-[80]"
    >
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
          "overlay-blur z-[80] overflow-hidden rounded-lg border-border-overlay bg-bg-overlay px-2 py-1.5 has-[kbd]:pl-2 has-[kbd]:pr-1.5 text-fg-on-overlay text-sm font-[470] shadow-md motion-reduce:animate-none motion-reduce:transition-none animate-in fade-in-0 zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        data-slot="tooltip-content"
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipPrimitive.Arrow className="data-[side=top]:bottom-[-4px] data-[side=bottom]:top-[-4px] data-[side=left]:right-[-4px] data-[side=right]:left-[-4px] size-2.5 rotate-45 rounded-[2px] border-r border-b border-border-overlay bg-bg-overlay" />
        )}
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
));
TooltipPopup.displayName = TooltipPrimitive.Popup.displayName;

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipPopup as TooltipContent,
};
