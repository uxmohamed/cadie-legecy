"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function useToast() {
  const showToast = (
    message: string, 
    type: "success" | "error" | "info",
    options?: ToastOptions
  ) => {
    const toastOptions = {
      duration: options?.duration,
      action: options?.action,
    };

    switch (type) {
      case "success":
        sonnerToast.success(message, toastOptions);
        break;
      case "error":
        sonnerToast.error(message, toastOptions);
        break;
      case "info":
        sonnerToast.info(message, toastOptions);
        break;
    }
  };

  return { showToast };
}

