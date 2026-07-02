import { apiRequest } from "./client";

export async function fetchStoreAnnouncements() {
  return apiRequest("/api/announcements", { requireAuth: false });
}
