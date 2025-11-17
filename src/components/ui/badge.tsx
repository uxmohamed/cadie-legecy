import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-slate-200 border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11 dark:border-slate-800 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "px-[calc(--spacing(1)-1px)] text-xs",
        lg: "px-[calc(--spacing(1.5)-1px)] text-sm",
        sm: "rounded-[calc(var(--radius-sm)-2px)] px-[calc(--spacing(1)-1px)] text-[.625rem]",
      },
      variant: {
        default:
          "bg-slate-900 text-slate-50 [button,a&]:hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:[button,a&]:hover:bg-slate-50/90",
        destructive:
          "bg-red-500 text-white [button,a&]:hover:bg-red-500/90 dark:bg-red-900 dark:[button,a&]:hover:bg-red-900/90",
        error:
          "bg-red-500/8 text-slate-50 dark:bg-red-500/16 dark:bg-red-900/8 dark:text-slate-50 dark:dark:bg-red-900/16",
        info: "bg-info/8 text-info-foreground dark:bg-info/16",
        outline:
          "border-slate-200 bg-transparent dark:bg-slate-200/32 [button,a&]:hover:bg-slate-100/50 dark:[button,a&]:hover:bg-slate-200/48 dark:border-slate-800 dark:dark:bg-slate-800/32 dark:[button,a&]:hover:bg-slate-800/50 dark:dark:[button,a&]:hover:bg-slate-800/48",
        secondary:
          "bg-slate-100 text-slate-900 [button,a&]:hover:bg-slate-100/90 dark:bg-slate-800 dark:text-slate-50 dark:[button,a&]:hover:bg-slate-800/90",
        success: "bg-success/8 text-success-foreground dark:bg-success/16",
        warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
      },
    },
  },
);

interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"];
  size?: VariantProps<typeof badgeVariants>["size"];
}

function Badge({ className, variant, size, render, ...props }: BadgeProps) {
  const defaultProps = {
    className: cn(badgeVariants({ className, size, variant })),
    "data-slot": "badge",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export { Badge, badgeVariants };
