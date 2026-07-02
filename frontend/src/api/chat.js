import { apiRequest } from "./client";

export async function fetchChatThread() {
  return apiRequest("/api/chat");
}

export async function pollChatMessages(sinceId) {
  const params = sinceId ? { since: String(sinceId) } : {};
  return apiRequest("/api/chat/messages", { params });
}

export async function sendChatMessage(body) {
  return apiRequest("/api/chat/messages", {
    method: "POST",
    body: { body },
  });
}
