"use server";

import { revalidatePath } from "next/cache";

/**
 * Triggers a server-side revalidation of the catalogue page.
 * This ensures that stock levels are updated without a full page reload.
 */
export async function refreshCatalogue() {
  revalidatePath("/");
}
