"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { SwUnregister } from "@/components/pwa/sw-unregister";
import { ChunkReloadGuard } from "@/components/chunk-reload-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SwUnregister />
        <ChunkReloadGuard />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
