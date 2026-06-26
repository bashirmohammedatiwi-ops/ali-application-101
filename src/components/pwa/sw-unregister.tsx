"use client";

import { useEffect } from "react";

/** Remove legacy service workers that can serve stale JS after deploy. */
export function SwUnregister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }, []);

  return null;
}
