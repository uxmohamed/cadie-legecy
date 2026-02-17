"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative w-full", className)}
    data-slot="slider"
    {...props}
  >
    <SliderPrimitive.Control className="relative flex w-full touch-none select-none items-center">
      <SliderPrimitive.Track
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border"
        data-slot="slider-track"
      >
        <SliderPrimitive.Indicator
          className="absolute h-full bg-btn-primary"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block size-4 rounded-full border border-border-emphasis/50 bg-bg-surface shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-emphasis disabled:pointer-events-none disabled:opacity-50"
        data-slot="slider-thumb"
      />
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
