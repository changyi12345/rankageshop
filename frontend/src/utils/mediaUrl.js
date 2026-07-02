import { toApiMediaUrl, toUploadUrl } from "../config/apiOrigin";

/** @see toApiMediaUrl */
export function resolveMediaUrl(path) {
  return toApiMediaUrl(path);
}

/** @see toUploadUrl */
export function resolveUploadUrl(path) {
  return toUploadUrl(path);
}

export { API_ORIGIN, toApiMediaUrl, toUploadUrl } from "../config/apiOrigin";
