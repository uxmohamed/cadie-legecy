"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetPortal = SheetPrimitive.Portal;

const SheetClose = SheetPrimitive.Close;

const sheetPopupVariants = cva(
  "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-white text-neutral-950 shadow-lg transition-[opacity,translate] duration-300 ease-in-out will-change-transform [--sheet-inset:0px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 dark:bg-neutral-950 dark:text-neutral-50",
  {
    defaultVariants: {
      inset: false,
      side: "right",
    },
    variants: {
      inset: {
        true: "sm:rounded-xl sm:[--sheet-inset:1rem]",
      },
      side: {
        bottom:
          "inset-x-[var(--sheet-inset)] bottom-[var(--sheet-inset)] h-auto max-h-[calc(100dvh-var(--sheet-inset)*2)] data-[state=closed]:tranneutral-y-full data-[state=open]:tranneutral-y-0",
        left: "data-[state=closed]:-tranneutral-x-full data-[state=open]:tranneutral-x-0 inset-y-[var(--sheet-inset)] left-[var(--sheet-inset)] h-dvh w-[calc(100%-(--spacing(12)))] max-w-sm sm:h-[calc(100dvh-var(--sheet-inset)*2)]",
        right:
          "inset-y-[var(--sheet-inset)] right-[var(--sheet-inset)] h-dvh w-[calc(100%-(--spacing(12)))] max-w-sm data-[state=closed]:tranneutral-x-full data-[state=open]:tranneutral-x-0 sm:h-[calc(100dvh-var(--sheet-inset)*2)]",
        top: "data-[state=closed]:-tranneutral-y-full data-[state=open]:tranneutral-y-0 inset-x-[var(--sheet-inset)] top-[var(--sheet-inset)] h-auto max-h-[calc(100dvh-var(--sheet-inset)*2)]",
      },
    },
  },
);

const SheetBackdrop = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
    data-slot="sheet-backdrop"
  />
));
SheetBackdrop.displayName = SheetPrimitive.Overlay.displayName;

const SheetPopup = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    showCloseButton?: boolean;
  } & VariantProps<typeof sheetPopupVariants>
>(
  (
    {
      className,
      children,
      showCloseButton = true,
      side = "right",
      inset = false,
      ...props
    },
    ref,
  ) => (
    <SheetPortal>
      <SheetBackdrop />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetPopupVariants({ inset, side }), className)}
        data-slot="sheet-popup"
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute end-2 top-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-neutral-200 border-transparent opacity-72 outline-none transition-[color,background-color,box-shadow,opacity] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:border-neutral-800 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950">
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
SheetPopup.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 p-4", className)}
    data-slot="sheet-header"
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    data-slot="sheet-footer"
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("font-semibold", className)}
    data-slot="sheet-title"
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-neutral-500 text-sm dark:text-neutral-400", className)}
    data-slot="sheet-description"
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetBackdrop,
  SheetBackdrop as SheetOverlay,
  SheetPopup,
  SheetPopup as SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetPopupVariants,
};
