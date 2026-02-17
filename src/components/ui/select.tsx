"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default" | "lg";
  }
>(({ className, children, size = "default", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-border bg-bg-input bg-clip-padding px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] data-[placeholder]:text-fg-subtle text-base/5 shadow-xs outline-none ring-border-emphasis/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-[state=open]:before:shadow-[0_1px_--theme(--color-black/4%)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 focus-visible:border-border-emphasis focus-visible:ring-[3px] aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-sm [&:is([data-disabled],:focus-visible,[aria-invalid],[data-state=open])]:shadow-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
      size === "sm" &&
        "gap-1.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)]",
      size === "lg" && "py-[calc(--spacing(2)-1px)]",
      className,
    )}
    data-slot="select-trigger"
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="-me-1 size-4 opacity-72">
      <IconChevronDown className="h-4 w-4" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpArrow>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpArrow
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <IconChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpArrow>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpArrow.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownArrow>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownArrow>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownArrow
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <IconChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownArrow>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownArrow.displayName;

type SelectPopupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>["align"];
  side?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>["side"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>["sideOffset"];
  position?: "popper" | "item-aligned";
};

const SelectPopup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Popup>,
  SelectPopupProps
>(({ className, children, align, side, sideOffset = 4, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      positionMethod="fixed"
      className="z-[80]"
    >
      <SelectPrimitive.Popup
        ref={ref}
        className={cn(
          "relative z-[80] max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-border-overlay bg-bg-overlay text-fg-on-overlay shadow-md motion-reduce:animate-none motion-reduce:transition-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        data-slot="select-popup"
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.List
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--anchor-height)] w-full min-w-[var(--anchor-width)]",
          )}
        >
          {children}
        </SelectPrimitive.List>
        <SelectScrollDownButton />
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>
));
SelectPopup.displayName = SelectPrimitive.Popup.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-fg-on-overlay focus:bg-btn-overlay-hover focus:text-fg-on-overlay data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    data-slot="select-item"
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <IconCheck className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-overlay", className)}
    data-slot="select-separator"
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

const SelectGroupLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.GroupLabel
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 font-semibold text-sm", className)}
    data-slot="select-group-label"
    {...props}
  />
));
SelectGroupLabel.displayName = SelectPrimitive.GroupLabel.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectPopup,
  SelectPopup as SelectContent,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
