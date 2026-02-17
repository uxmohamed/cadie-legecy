"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "underline";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-fg-muted",
      "data-[orientation=vertical]:flex-col",
      variant === "default"
        ? "rounded-lg bg-bg-emphasis p-0.5 text-fg-subtle"
        : "data-[orientation=vertical]:px-1 data-[orientation=horizontal]:py-1",
      className,
    )}
    data-slot="tabs-list"
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTab = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tab>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab> & {
    variant?: "default" | "underline";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    className={cn(
      "flex flex-1 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-transparent font-medium text-sm outline-none transition-[color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-border-emphasis disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      "hover:text-fg-muted data-[selected]:text-fg",
      "gap-1.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1.5)-1px)]",
      "data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start",
      variant === "default" &&
        "data-[selected]:bg-bg-selected data-[selected]:shadow-sm",
      variant === "underline" &&
        "rounded-none border-b-2 border-transparent data-[selected]:border-border-emphasis",
      className,
    )}
    data-slot="tabs-trigger"
    {...props}
  />
));
TabsTab.displayName = TabsPrimitive.Tab.displayName;

const TabsPanel = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    className={cn("flex-1 outline-none", className)}
    data-slot="tabs-content"
    {...props}
  />
));
TabsPanel.displayName = TabsPrimitive.Panel.displayName;

export {
  Tabs,
  TabsList,
  TabsTab,
  TabsTab as TabsTrigger,
  TabsPanel,
  TabsPanel as TabsContent,
};
