/**
 * API host for production media/uploads.
 * Local dev uses the Vite proxy (vite.config.js → localhost:4000).
 */
export const API_ORIGIN = "https://api.rankage.shop";

/**
 * Turn /media/... (or payment_methods/foo.png) into a full API URL.
 * Local dev: keep /media/... for the Vite proxy.
 */
export function toApiMediaUrl(path) {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  let mediaPath = trimmed;
  if (mediaPath.startsWith("media/")) {
    mediaPath = `/${mediaPath}`;
  } else if (!mediaPath.startsWith("/media/")) {
    mediaPath = mediaPath.startsWith("/")
      ? `/media${mediaPath}`
      : `/media/${mediaPath.replace(/^media\//, "")}`;
  }

  if (import.meta.env.DEV) {
    return mediaPath;
  }

  return `${API_ORIGIN}${mediaPath}`;
}

/**
 * Resolve /uploads/... payment proof paths (Vite proxies /uploads in dev).
 */
export function toUploadUrl(path) {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  let uploadPath = trimmed;
  if (!uploadPath.startsWith("/uploads/")) {
    uploadPath = uploadPath.startsWith("uploads/")
      ? `/${uploadPath}`
      : `/uploads/${uploadPath.replace(/^\/+/, "")}`;
  }

  if (import.meta.env.DEV) {
    return uploadPath;
  }

  return `${API_ORIGIN}${uploadPath}`;
}
