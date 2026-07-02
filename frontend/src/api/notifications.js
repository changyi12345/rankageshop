import { apiRequest } from "./client";

export function normalizeNotification(row) {
  if (!row || typeof row !== "object") return row;
  return {
    id: row.id,
    type: row.type ?? "system",
    title: row.title ?? "",
    body: row.body ?? "",
    url: row.url ?? null,
    read: Boolean(row.read ?? row.readAt),
    readAt: row.readAt ?? row.read_at ?? null,
    createdAt: row.createdAt ?? row.created_at,
  };
}

export async function fetchNotifications({ limit = 50, unreadOnly = false } = {}) {
  const data = await apiRequest("/api/notifications", {
    params: {
      limit,
      ...(unreadOnly ? { unreadOnly: "true" } : {}),
    },
  });
  return (Array.isArray(data) ? data : []).map(normalizeNotification);
}

export async function fetchUnreadNotificationCount() {
  const data = await apiRequest("/api/notifications/unread-count");
  return Number(data?.count ?? 0);
}

export async function markNotificationRead(id) {
  const data = await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
  return normalizeNotification(data);
}

export async function markAllNotificationsRead() {
  return apiRequest("/api/notifications/read-all", { method: "POST" });
}

export async function fetchPushPublicKey() {
  return apiRequest("/api/push/vapid-public-key", { requireAuth: false });
}

export async function subscribeWebPush(subscription) {
  return apiRequest("/api/push/subscribe", {
    method: "POST",
    body: {
      subscription,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
  });
}
