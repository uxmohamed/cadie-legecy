"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-center"
      offset={24}
      visibleToasts={5}
      toastOptions={{
        className: "toast-dock-style",
      }}
    />
  );
}
