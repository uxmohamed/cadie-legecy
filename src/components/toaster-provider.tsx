"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-center"
      offset={24}
      toastOptions={{
        className: "toast-dock-style",
      }}
    />
  );
}
