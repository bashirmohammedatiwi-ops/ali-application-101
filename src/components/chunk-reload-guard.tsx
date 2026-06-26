"use client";

import { useEffect } from "react";

const RELOAD_KEY = "mg-chunk-reload";

function isChunkLoadError(message: string) {
  return /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
    message
  );
}

/** After deploy, old cached JS may request missing chunks — reload once. */
export function ChunkReloadGuard() {
  useEffect(() => {
    const reloadOnce = () => {
      if (sessionStorage.getItem(RELOAD_KEY)) return false;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
      return true;
    };

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message ?? "")) reloadOnce();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason ?? "");
      if (isChunkLoadError(reason)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
