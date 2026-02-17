"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import * as React from "react";

import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

const CollapsiblePanel = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Panel>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Panel
    ref={ref}
    className={cn(
      "overflow-hidden transition-[height,opacity] motion-reduce:animate-none motion-reduce:transition-none data-[ending-style]:animate-collapsible-up data-[starting-style]:animate-collapsible-down",
      className,
    )}
    data-slot="collapsible-panel"
    {...props}
  />
));
CollapsiblePanel.displayName = CollapsiblePrimitive.Panel.displayName;

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsiblePanel,
  CollapsiblePanel as CollapsibleContent,
};
