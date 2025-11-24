"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogBackdrop = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
      className,
    )}
    data-slot="dialog-backdrop"
    {...props}
  />
));
DialogBackdrop.displayName = DialogPrimitive.Overlay.displayName;

const DialogPopup = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdrop />
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="flex h-dvh flex-col items-center overflow-hidden pt-6 max-sm:before:flex-1 sm:overflow-y-auto sm:p-4 sm:after:flex-1 sm:before:basis-[20vh] pointer-events-auto">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "sm:-translate-y-[calc(1.25rem*var(--nested-dialogs))] relative row-start-2 grid w-full min-w-0 origin-top gap-4 border border-slate-200 bg-white bg-clip-padding p-6 text-slate-950 shadow-lg transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 max-sm:overflow-y-auto max-sm:border-none max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:before:hidden sm:max-w-lg sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:rounded-2xl sm:before:rounded-[calc(var(--radius-2xl)-1px)] dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
            className,
          )}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute end-2 top-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 border-transparent opacity-72 outline-none transition-[color,background-color,box-shadow,opacity] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:border-slate-800 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950">
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </div>
  </DialogPortal>
));
DialogPopup.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1 text-center sm:text-left", className)}
    data-slot="dialog-header"
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sm:-mx-6 sm:-mb-6 flex flex-col-reverse gap-2 sm:mt-2 sm:flex-row sm:justify-end sm:rounded-b-xl sm:border-t sm:bg-slate-100/50 sm:px-6 sm:py-4 dark:sm:bg-slate-800/50",
      className,
    )}
    data-slot="dialog-footer"
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-heading text-xl leading-none", className)}
    data-slot="dialog-title"
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-slate-500 text-sm dark:text-slate-400", className)}
    data-slot="dialog-description"
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogBackdrop as DialogOverlay,
  DialogPopup,
  DialogPopup as DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
