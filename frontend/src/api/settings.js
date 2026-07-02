import { apiRequest } from "./client";

export async function fetchPublicShopSettings() {
  return apiRequest("/api/settings/shop", { requireAuth: false });
}
