"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { IconCheck, IconChevronRight, IconCircle } from "@tabler/icons-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const DropdownMenu = MenuPrimitive.Root

const DropdownMenuTrigger = MenuPrimitive.Trigger

const DropdownMenuGroup = MenuPrimitive.Group

const DropdownMenuPortal = MenuPrimitive.Portal

const DropdownMenuSub = MenuPrimitive.SubmenuRoot

const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.SubmenuTrigger>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.SubmenuTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenuPrimitive.SubmenuTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-4 rounded-lg px-2 py-1.5 text-sm font-[470] outline-none text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] data-[open]:bg-[var(--overlay-hover)] data-[state=open]:bg-[var(--overlay-hover)]",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <IconChevronRight className="ml-auto h-4 w-4" />
  </MenuPrimitive.SubmenuTrigger>
))
DropdownMenuSubTrigger.displayName =
  MenuPrimitive.SubmenuTrigger.displayName

type DropdownMenuSubContentProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["align"]
  side?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["side"]
  sideOffset?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["sideOffset"]
  alignOffset?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["alignOffset"]
}

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Popup>,
  DropdownMenuSubContentProps
>(({ className, sideOffset = 10, alignOffset = -8, style, align, side, ...props }, ref) => {
  return (
    <MenuPrimitive.Portal>
    <MenuPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      positionMethod="fixed"
      className="z-[90]"
    >
      <MenuPrimitive.Popup
        ref={ref}
        style={{ ...style, marginTop: "-8px" }}
        className={cn(
          "overlay-blur z-[90] min-w-[10rem] max-w-[224px] overflow-hidden rounded-[14px] border-[var(--overlay-border)] p-2 text-[var(--overlay-text-primary)] data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
})
DropdownMenuSubContent.displayName =
  MenuPrimitive.Popup.displayName

type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["align"]
  side?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["side"]
  sideOffset?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["sideOffset"]
  alignOffset?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Positioner>["alignOffset"]
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Popup>,
  DropdownMenuContentProps
>(({ className, sideOffset = 4, alignOffset, align, side, ...props }, ref) => (
  <MenuPrimitive.Portal>
    <MenuPrimitive.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      positionMethod="fixed"
      className="z-[90]"
    >
      <MenuPrimitive.Popup
        ref={ref}
        className={cn(
          "overlay-blur z-[90] min-w-[8rem] overflow-hidden rounded-[18px] p-2 text-[var(--overlay-text-primary)] data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Positioner>
  </MenuPrimitive.Portal>
))
DropdownMenuContent.displayName = MenuPrimitive.Popup.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] focus:text-[var(--overlay-text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = MenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center justify-between rounded-lg py-1.5 px-2 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] focus:text-[var(--overlay-text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {children}
    </div>
    <span className="flex h-3.5 w-3.5 items-center justify-center shrink-0">
      <MenuPrimitive.CheckboxItemIndicator>
        <IconCheck className="h-4 w-4" />
      </MenuPrimitive.CheckboxItemIndicator>
    </span>
  </MenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  MenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm font-[470] outline-none transition-colors text-[var(--overlay-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[var(--overlay-hover)] focus:text-[var(--overlay-text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenuPrimitive.RadioItemIndicator>
        <IconCircle className="h-2 w-2 fill-current" />
      </MenuPrimitive.RadioItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = MenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.GroupLabel> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.GroupLabel
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-[470]",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = MenuPrimitive.GroupLabel.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-2 h-px bg-[var(--overlay-separator)]", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = MenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenu as Menu,
  DropdownMenuTrigger as MenuTrigger,
  DropdownMenuContent as MenuPopup,
  DropdownMenuItem as MenuItem,
  DropdownMenuCheckboxItem as MenuCheckboxItem,
  DropdownMenuRadioGroup as MenuRadioGroup,
  DropdownMenuRadioItem as MenuRadioItem,
  DropdownMenuLabel as MenuGroupLabel,
  DropdownMenuSeparator as MenuSeparator,
  DropdownMenuShortcut as MenuShortcut,
  DropdownMenuGroup as MenuGroup,
  DropdownMenuPortal as MenuPortal,
  DropdownMenuSub as MenuSub,
  DropdownMenuSubContent as MenuSubPopup,
  DropdownMenuSubTrigger as MenuSubTrigger,
}
