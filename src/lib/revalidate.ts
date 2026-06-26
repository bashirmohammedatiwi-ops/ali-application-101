import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export function invalidateAppData() {
  updateTag(CACHE_TAGS.dashboard);
  updateTag(CACHE_TAGS.settings);
}

export function invalidateOrders() {
  invalidateAppData();
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  revalidatePath("/pricing");
  revalidatePath("/priced");
  revalidatePath("/invoices");
  revalidatePath("/archive");
}
