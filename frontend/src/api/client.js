import { API_ORIGIN } from "../config/apiOrigin";

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function getApiUrl(path, params = {}) {
  let url;
  if (path.startsWith("http")) {
    url = new URL(path);
  } else {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (import.meta.env.DEV) {
      url = new URL(normalizedPath, window.location.origin);
    } else {
      url = new URL(normalizedPath, API_ORIGIN);
    }
  }
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return false;
    }

    try {
      const response = await fetch(getApiUrl("/api/auth/token/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access ?? data.access_token, data.refresh ?? data.refresh_token ?? data.access_token);
      return true;
    }
  } catch {
    // Ignore
  }

  clearTokens();
  return false;
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {}, requireAuth = true, params = {} } = {}
) {
  const url = getApiUrl(path, params);
  const requestHeaders = {
    ...headers,
  };
  
  // Don't set Content-Type for FormData
  if (!(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const makeRequest = async () => {
    if (requireAuth) {
      const access = getAccessToken();
      if (access) {
        requestHeaders.Authorization = `Bearer ${access}`;
      }
    }

    const options = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return response;
  };

  let response = await makeRequest();

  if (response.status === 401 && requireAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await makeRequest();
    }
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      Object.values(data || {})
        .flat()
        .join(", ") ||
      `Request failed with status ${response.status}`;
    const err = new ApiError(message, response.status, data);
    if (response.status === 503 && data?.maintenanceMode) {
      window.dispatchEvent(
        new CustomEvent("rankage:maintenance", { detail: { message } }),
      );
    }
    throw err;
  }

  return data;
}
