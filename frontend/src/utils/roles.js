export function isAdminRole(role) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}
