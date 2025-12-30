"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// TEMPORARY: Development navigation component - remove before production
export function AuthNavigation() {
  const router = useRouter();

  const handleNext = React.useCallback(() => {
    // TEMPORARY: Navigate to home page with dev query param to show onboarding flow
    router.push("/?dev=onboarding");
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-[var(--text-tertiary)]">
        Step 0 of 3 (Auth)
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          disabled
          variant="ghost"
          size="sm"
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          variant="ghost"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
