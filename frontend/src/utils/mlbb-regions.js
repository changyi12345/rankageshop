export const MLBB_UNIFIED_CODE = "mlbb_unified";

export const MLBB_REGIONS = [
  { id: "mm", label: "Myanmar", flag: "🇲🇲", gameCode: "mlbb" },
  { id: "id", label: "Indonesia", flag: "🇮🇩", gameCode: "mlbb_global", note: "Indonesia players" },
  { id: "global", label: "Global", flag: "🌍", gameCode: "mlbb_global" },
  { id: "ru", label: "Russia", flag: "🇷🇺", gameCode: "mlbb_ru" },
  { id: "tr", label: "Turkey", flag: "🇹🇷", gameCode: "mlbb_tr" },
  { id: "br", label: "Brazil", flag: "🇧🇷", gameCode: "mlbb_br" },
  { id: "special", label: "Special", flag: "⭐", gameCode: "mlbb_special" },
  { id: "exclusive", label: "Exclusive", flag: "💎", gameCode: "mlbb_exclusive" },
];

export function isMlbbVariant(code) {
  return code === "mlbb" || (typeof code === "string" && code.startsWith("mlbb_"));
}

export function isMlbbUnified(code) {
  return code === MLBB_UNIFIED_CODE || isMlbbVariant(code);
}

export function mlbbRegionTabs() {
  return MLBB_REGIONS.map((r) => ({ code: r.id, label: r.label }));
}

export function resolveMlbbGameCode(regionId) {
  return MLBB_REGIONS.find((r) => r.id === regionId)?.gameCode ?? MLBB_REGIONS[0].gameCode;
}

export function resolveMlbbRegionFromCode(code) {
  if (code === MLBB_UNIFIED_CODE) return MLBB_REGIONS[0].id;
  const match = MLBB_REGIONS.find((r) => r.gameCode === code);
  if (match) return match.id;
  if (isMlbbVariant(code)) return MLBB_REGIONS[0].id;
  return null;
}
