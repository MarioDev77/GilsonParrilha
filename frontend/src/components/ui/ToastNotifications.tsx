"use client";

import { Toaster } from "sonner";

export function ToastNotifications() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      closeButton
      toastOptions={{
        style: { background: "#2B231E", border: "1px solid #3A302A", color: "#EFE8DD", fontFamily: "inherit" },
      }}
    />
  );
}
