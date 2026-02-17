import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("inline-flex items-center gap-2 text-sm/4", className)}
        data-slot="label"
        {...props}
      />
    );
  },
);

Label.displayName = "Label";

export { Label };
