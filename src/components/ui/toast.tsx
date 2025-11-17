"use client";

import { toast as sonnerToast } from "sonner";

export function useToast() {
  const showToast = (message: string, type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        sonnerToast.success(message);
        break;
      case "error":
        sonnerToast.error(message);
        break;
      case "info":
        sonnerToast.info(message);
        break;
    }
  };

  return { showToast };
}

