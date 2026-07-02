import { apiRequest } from "./client";

export async function fetchHomeContent() {
  return apiRequest("/api/content/home", { requireAuth: false });
}

export async function fetchShopEvents() {
  return apiRequest("/api/content/events", { requireAuth: false });
}

export async function fetchShopEvent(slug) {
  return apiRequest(`/api/content/events/${encodeURIComponent(slug)}`, { requireAuth: false });
}
