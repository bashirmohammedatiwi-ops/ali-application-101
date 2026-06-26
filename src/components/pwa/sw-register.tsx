"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const reloadOnUpdate = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("message", reloadOnUpdate);
    return () => navigator.serviceWorker.removeEventListener("message", reloadOnUpdate);
  }, []);

  return null;
}
