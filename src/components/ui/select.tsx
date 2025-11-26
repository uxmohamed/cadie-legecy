"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { IconChevronUp, IconChevronDown, IconCheck } from "@tabler/icons-react";
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
      "relative inline-flex w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white bg-clip-padding px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] data-[placeholder]:text-neutral-500 text-base/5 shadow-xs outline-none ring-neutral-950/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-[state=open]:before:shadow-[0_1px_--theme(--color-black/4%)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 focus-visible:border-neutral-950 focus-visible:ring-[3px] aria-invalid:border-red-500/36 focus-visible:aria-invalid:border-red-500/64 focus-visible:aria-invalid:ring-red-500/16 data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-sm [&:is([data-disabled],:focus-visible,[aria-invalid],[data-state=open])]:shadow-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-72",
      size === "sm" &&
        "gap-1.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)]",
      size === "lg" && "py-[calc(--spacing(2)-1px)]",
      className,
    )}
    data-slot="select-trigger"
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span className="-me-1 size-4 opacity-72">
        <IconChevronDown className="h-4 w-4" />
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <IconChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className,
    )}
    {...props}
  >
    <IconChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectPopup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:tranneutral-y-1 data-[side=left]:-tranneutral-x-1 data-[side=right]:tranneutral-x-1 data-[side=top]:-tranneutral-y-1",
        className,
      )}
      position={position}
      data-slot="select-popup"
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectPopup.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
    className={cn("-mx-1 my-1 h-px bg-neutral-100", className)}
    data-slot="select-separator"
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

const SelectGroupLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 font-semibold text-sm", className)}
    data-slot="select-group-label"
    {...props}
  />
));
SelectGroupLabel.displayName = SelectPrimitive.Label.displayName;

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
