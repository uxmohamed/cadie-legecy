"use client";

import { Avatar as AvatarPrimitive } from "@base-ui-components/react/avatar";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-white align-middle font-medium text-xs dark:bg-slate-950",
        className,
      )}
      data-slot="avatar"
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      className={cn("size-full object-cover", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
