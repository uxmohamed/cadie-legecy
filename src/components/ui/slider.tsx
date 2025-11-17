"use client";

import { Slider as SliderPrimitive } from "@base-ui-components/react/slider";
import * as React from "react";

import { cn } from "@/lib/utils";

function Slider({
  className,
  children,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = React.useMemo(() => {
    if (value !== undefined) {
      return Array.isArray(value) ? value : [value];
    }
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [min];
  }, [value, defaultValue, min]);

  return (
    <SliderPrimitive.Root
      className="data-[orientation=horizontal]:w-full"
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment="edge"
      value={value}
      {...props}
    >
      {children}
      <SliderPrimitive.Control
        className={cn(
          "flex touch-none select-none data-[disabled]:pointer-events-none data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-44 data-[orientation=vertical]:flex-col data-disabled:opacity-64",
          className,
        )}
        data-slot="slider-control"
      >
        <SliderPrimitive.Track
          className="relative grow select-none before:absolute before:rounded-full before:bg-slate-200 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1 data-[orientation=horizontal]:before:inset-x-0.5 data-[orientation=vertical]:before:inset-x-0 data-[orientation=horizontal]:before:inset-y-0 data-[orientation=vertical]:before:inset-y-0.5 dark:before:bg-slate-800"
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            className="select-none rounded-full bg-slate-900 data-[orientation=horizontal]:ms-0.5 data-[orientation=vertical]:mb-0.5 dark:bg-slate-50"
            data-slot="slider-indicator"
          />
          {Array.from({ length: _values.length }, (_, index) => (
            <SliderPrimitive.Thumb
              className="block size-4 shrink-0 select-none rounded-full border border-slate-200 bg-white bg-clip-padding shadow-xs outline-none transition-shadow before:absolute before:inset-0 before:rounded-full before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-[3px] focus-visible:ring-slate-950/24 has-focus-visible:ring-[3px] has-focus-visible:ring-slate-950/24 data-dragging:ring-[3px] data-dragging:ring-slate-950/24 dark:border-white dark:bg-clip-border dark:data-dragging:ring-slate-950/48 dark:focus-visible:ring-slate-950/48 [&:is(:focus-visible,[data-dragging])]:shadow-none dark:border-slate-800 dark:focus-visible:ring-slate-300/24 dark:has-focus-visible:ring-slate-300/24 dark:data-dragging:ring-slate-300/24 dark:dark:border-slate-950 dark:dark:data-dragging:ring-slate-300/48 dark:dark:focus-visible:ring-slate-300/48"
              data-slot="slider-thumb"
              key={String(index)}
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
  return (
    <SliderPrimitive.Value
      className={cn("flex justify-end text-sm", className)}
      data-slot="slider-value"
      {...props}
    />
  );
}

export { Slider, SliderValue };
