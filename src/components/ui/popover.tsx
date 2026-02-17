"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";

import { cn } from "@/lib/utils";

type PopoverPopupProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Positioner>["align"];
  side?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Positioner>["side"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Positioner>["sideOffset"];
  tooltipStyle?: boolean;
};

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverPopup = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Popup>,
  PopoverPopupProps
>(
  (
    {
      className,
      align = "center",
      side,
      sideOffset = 4,
      tooltipStyle = false,
      ...props
    },
    ref,
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        positionMethod="fixed"
        className="z-[80]"
      >
        <PopoverPrimitive.Popup
          ref={ref}
          className={cn(
            "overlay-blur z-[80] w-72 rounded-[20px] border-border-overlay bg-bg-overlay p-4 text-fg-on-overlay shadow-md outline-none motion-reduce:animate-none motion-reduce:transition-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            tooltipStyle &&
              "w-fit text-balance rounded-[18px] text-xs shadow-black/5 shadow-md",
            className,
          )}
          data-slot="popover-content"
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  ),
);
PopoverPopup.displayName = PopoverPrimitive.Popup.displayName;

const PopoverClose = PopoverPrimitive.Close;

const PopoverTitle = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Title>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Title
    ref={ref}
    className={cn("font-semibold text-lg leading-none", className)}
    data-slot="popover-title"
    {...props}
  />
));
PopoverTitle.displayName = "PopoverTitle";

const PopoverDescription = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Description>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Description
    ref={ref}
    className={cn("text-fg-on-overlay-muted text-sm", className)}
    data-slot="popover-description"
    {...props}
  />
));
PopoverDescription.displayName = "PopoverDescription";

export {
  Popover,
  PopoverTrigger,
  PopoverPopup,
  PopoverPopup as PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
};
