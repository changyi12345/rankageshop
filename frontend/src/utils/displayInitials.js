/**
 * Display initials for avatars — e.g. "Daniel Aveiro" → "DA", "Daniel" → "DA".
 */
export function getDisplayInitials(name, fallback = "?") {
  const raw = String(name ?? "").trim();
  if (!raw) return fallback;

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].replace(/[^A-Za-z0-9]/g, "");
    const last = parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, "");
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
  }

  const word = (parts[0] || raw).replace(/[^A-Za-z0-9]/g, "");
  if (word.length >= 2) {
    return `${word.charAt(0)}${word.charAt(1)}`.toUpperCase();
  }
  if (word.length === 1) {
    return word.charAt(0).toUpperCase();
  }
  return fallback;
}

export function getDisplayInitialsFromUser(user) {
  if (!user) return "?";
  const name =
    user.username ||
    (typeof user.email === "string" ? user.email.split("@")[0] : "") ||
    "";
  return getDisplayInitials(name);
}
