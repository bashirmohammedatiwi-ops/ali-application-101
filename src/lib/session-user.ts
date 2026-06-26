import { cache } from "react";
import { auth } from "@/lib/auth";

/** Deduplicated session lookup per request */
export const getSessionUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});
