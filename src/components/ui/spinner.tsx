import { IconLoader2 } from "@tabler/icons-react";

function Spinner({ className }: { className?: string }) {
  return (
    <span className={className} role="status" aria-label="Loading">
      <IconLoader2 className="h-4 w-4 animate-spin" />
    </span>
  );
}

export { Spinner };
