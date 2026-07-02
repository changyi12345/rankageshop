import {
  apiRequest,
  setTokens,
  clearTokens,
} from "./client";
import { normalizeUser } from "../utils/normalizeUser";

export async function register({ username, email, password, password_confirm }) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: { username, email, password, password_confirm },
    requireAuth: false,
  });
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token ?? data.access_token);
  }
  if (data.user) data.user = normalizeUser(data.user);
  return data;
}

export async function login({ username, password }) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { username, password },
    requireAuth: false,
  });
  if (data.requires2FA) {
    return data;
  }
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token ?? data.access_token);
  }
  if (data.user) data.user = normalizeUser(data.user);
  return data;
}

export async function verifyAdmin2FA({ twoFactorToken, code }) {
  const data = await apiRequest("/api/auth/admin-2fa/verify", {
    method: "POST",
    body: { twoFactorToken, code },
    requireAuth: false,
  });
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token ?? data.access_token);
  }
  if (data.user) data.user = normalizeUser(data.user);
  return data;
}

export async function fetchGoogleAuthConfig() {
  return apiRequest("/api/auth/google/config", { requireAuth: false });
}

export async function googleLogin({ idToken, referralCode } = {}) {
  const data = await apiRequest("/api/auth/google", {
    method: "POST",
    body: { idToken, ...(referralCode ? { referralCode } : {}) },
    requireAuth: false,
  });
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token ?? data.access_token);
  }
  if (data.user) data.user = normalizeUser(data.user);
  return data;
}

export async function verifyEmail(token) {
  return apiRequest("/api/auth/verify-email", {
    method: "POST",
    body: { token },
    requireAuth: false,
  });
}

export async function resendVerification(email) {
  return apiRequest("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
    requireAuth: false,
  });
}

export async function forgotPassword(email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    requireAuth: false,
  });
}

export async function validateResetToken(token) {
  return apiRequest("/api/auth/validate-reset-token", {
    method: "POST",
    body: { token },
    requireAuth: false,
  });
}

export async function resetPassword({ token, password }) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: { token, newPassword: password },
    requireAuth: false,
  });
}

export async function fetchMe() {
  const user = await apiRequest("/api/auth/me");
  return normalizeUser(user);
}

export async function updateMe(data) {
  const user = await apiRequest("/api/auth/profile", { method: "PATCH", body: data });
  return normalizeUser(user);
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest("/api/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

export async function fetchAccountDeleteRequest() {
  return { requested: false };
}

export async function submitAccountDeleteRequest({ reason, message }) {
  const combined = [reason, message].filter(Boolean).join(" — ");
  return apiRequest("/api/auth/account-delete-request", {
    method: "POST",
    body: { reason: combined || undefined },
  });
}

export async function logout() {
  clearTokens();
}
