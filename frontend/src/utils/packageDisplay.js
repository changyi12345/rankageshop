import { formatNumber } from "./format";

/** Currency / item types detected from catalogue package names. */
export const PACKAGE_TYPES = {
  diamond: {
    id: "diamond",
    label: "Diamonds",
    shortLabel: "DM",
    accent: "from-blue-400/25 to-blue-700/20",
    iconColor: "text-blue-300",
    ring: "ring-blue-400/30",
  },
  uc: {
    id: "uc",
    label: "UC",
    shortLabel: "UC",
    accent: "from-blue-300/25 to-blue-800/20",
    iconColor: "text-blue-200",
    ring: "ring-blue-300/30",
  },
  coin: {
    id: "coin",
    label: "Coins",
    shortLabel: "Coins",
    accent: "from-sky-400/25 to-blue-700/20",
    iconColor: "text-sky-300",
    ring: "ring-sky-400/30",
  },
  gem: {
    id: "gem",
    label: "Gems",
    shortLabel: "Gems",
    accent: "from-blue-400/25 to-indigo-700/20",
    iconColor: "text-blue-300",
    ring: "ring-blue-400/30",
  },
  crystal: {
    id: "crystal",
    label: "Crystals",
    shortLabel: "Crystals",
    accent: "from-sky-400/25 to-blue-800/20",
    iconColor: "text-sky-300",
    ring: "ring-sky-400/30",
  },
  cp: {
    id: "cp",
    label: "CP",
    shortLabel: "CP",
    accent: "from-blue-500/25 to-blue-900/20",
    iconColor: "text-blue-300",
    ring: "ring-blue-500/30",
  },
  vp: {
    id: "vp",
    label: "VP",
    shortLabel: "VP",
    accent: "from-blue-400/25 to-blue-800/20",
    iconColor: "text-blue-300",
    ring: "ring-blue-400/30",
  },
  rp: {
    id: "rp",
    label: "RP",
    shortLabel: "RP",
    accent: "from-blue-400/25 to-indigo-700/20",
    iconColor: "text-blue-300",
    ring: "ring-blue-400/30",
  },
  token: {
    id: "token",
    label: "Tokens",
    shortLabel: "Tokens",
    accent: "from-blue-300/25 to-blue-700/20",
    iconColor: "text-blue-200",
    ring: "ring-blue-300/30",
  },
  pass: {
    id: "pass",
    label: "Pass",
    shortLabel: "Pass",
    accent: "from-accent/25 to-accent-dark/20",
    iconColor: "text-accent-light",
    ring: "ring-accent/35",
  },
  voucher: {
    id: "voucher",
    label: "Voucher",
    shortLabel: "Voucher",
    accent: "from-blue-400/20 to-accent-dark/20",
    iconColor: "text-accent-light",
    ring: "ring-accent/30",
  },
  default: {
    id: "default",
    label: "Package",
    shortLabel: "Pack",
    accent: "from-slate-400/15 to-slate-600/10",
    iconColor: "text-slate-300",
    ring: "ring-surface-border",
  },
};

const TYPE_MATCHERS = [
  { type: "pass", pattern: /\b(pass|membership|subscription|booyah|prime|elite|monthly|weekly|daily)\b/i },
  { type: "diamond", pattern: /\bdiamonds?\b|\bdm\b|\bdiamond\s*pass\b/i },
  { type: "uc", pattern: /\buc\b|\bunknown\s*cash\b|\bpubg\s*mobile\b/i },
  { type: "coin", pattern: /\bcoins?\b|\bgold\s*coins?\b|\bsilver\s*coins?\b/i },
  { type: "crystal", pattern: /\bcrystals?\b|\bprimogems?\b|\bgenesis\s*crystals?\b/i },
  { type: "gem", pattern: /\bgems?\b|\bjewels?\b|\brubies\b|\bshards?\b/i },
  { type: "cp", pattern: /\bcp\b|\bcod\s*points?\b|\bbattle\s*points?\b/i },
  { type: "vp", pattern: /\bvp\b|\bvalorant\s*points?\b|\bv\s*points?\b/i },
  { type: "rp", pattern: /\brp\b|\briot\s*points?\b|\blol\s*points?\b/i },
  { type: "voucher", pattern: /\bvouchers?\b|\bgift\s*card\b|\bcard\b/i },
  { type: "token", pattern: /\btokens?\b|\btickets?\b|\bscrolls?\b|\bemblems?\b/i },
];

const BONUS_PATTERN = /(\d[\d,]*)\s*\+\s*(\d[\d,]*)/;
const QUANTITY_PATTERN = /(\d[\d,]*)/g;

function parseNumber(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatQuantity(n) {
  if (n == null) return null;
  return formatNumber(n);
}

function detectType(name) {
  const text = name || "";
  for (const { type, pattern } of TYPE_MATCHERS) {
    if (pattern.test(text)) return type;
  }
  return "default";
}

function extractTags(name) {
  const text = (name || "").toLowerCase();
  const tags = [];
  if (/first\s*top[- ]?up|first\s*purchase|2x|double|bonus|extra|free|\+/.test(text)) {
    tags.push("Bonus");
  }
  if (/weekly|monthly|daily|pass|subscription/.test(text)) {
    tags.push("Subscription");
  }
  if (/limited|exclusive|special|event/.test(text)) {
    tags.push("Limited");
  }
  return tags;
}

/** Section key for grouping catalogue rows (reference-app style). */
export function getPackageCategory(name) {
  const text = (name || "").trim();
  const typeId = detectType(text);
  const lower = text.toLowerCase();

  if (typeId === "pass") return "pass";
  if (/first\s*top[- ]?up|first\s*time|first\s*purchase|\b2x\b|double\s*diamond/i.test(lower)) {
    return "first_bonus";
  }
  if (typeId === "diamond") return "diamond";
  if (typeId === "uc") return "uc";
  if (typeId === "crystal" || typeId === "gem") return "gem";
  if (typeId === "coin") return "coin";
  if (typeId === "cp" || typeId === "vp" || typeId === "rp") return "points";
  return "other";
}

const CATEGORY_META = {
  pass: { title: "Weekly Pass & Twilight Pass", order: 0 },
  first_bonus: { title: "2× Diamond (First Time Only)", order: 1 },
  diamond: { title: "Diamonds", order: 2 },
  uc: { title: "UC", order: 3 },
  gem: { title: "Gems & Crystals", order: 4 },
  coin: { title: "Coins", order: 5 },
  points: { title: "Game Points", order: 6 },
  other: { title: "Other packages", order: 7 },
};

/**
 * Group packages into labelled sections for the catalogue list.
 * @returns {{ id: string, title: string, packages: object[] }[]}
 */
export function groupPackagesByCategory(packages) {
  const buckets = new Map();

  for (const pkg of packages || []) {
    const cat = getPackageCategory(pkg?.name);
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat).push(pkg);
  }

  return [...buckets.entries()]
    .map(([id, items]) => ({
      id,
      title: CATEGORY_META[id]?.title ?? "Packages",
      order: CATEGORY_META[id]?.order ?? 99,
      packages: items,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Parse a store package into display metadata for cards and summaries.
 * @param {{ id?: string, name?: string, amount?: number, currency?: string }} pkg
 * @param {{ gameCode?: string, gameName?: string }} [context]
 */
export function parsePackageDisplay(pkg, context = {}) {
  const name = (pkg?.name || "").trim();
  const typeId = detectType(name);
  const type = PACKAGE_TYPES[typeId] || PACKAGE_TYPES.default;
  const tags = extractTags(name);

  let quantity = null;
  let bonus = null;
  let quantityLabel = null;

  const bonusMatch = name.match(BONUS_PATTERN);
  if (bonusMatch) {
    quantity = parseNumber(bonusMatch[1]);
    bonus = parseNumber(bonusMatch[2]);
    quantityLabel =
      bonus != null && quantity != null
        ? `${formatQuantity(quantity)} + ${formatQuantity(bonus)}`
        : null;
  } else {
    const numbers = [...name.matchAll(QUANTITY_PATTERN)].map((m) => parseNumber(m[1]));
    quantity = numbers[0] ?? null;
    if (quantity != null) {
      quantityLabel = formatQuantity(quantity);
    }
  }

  const headline =
    quantityLabel && typeId !== "default" && typeId !== "pass"
      ? `${quantityLabel} ${type.label}`
      : name || type.label;

  const subtitle =
    typeId === "pass"
      ? "Time-limited benefits & rewards"
      : bonus != null
        ? `Includes ${formatQuantity(bonus)} bonus ${type.label.toLowerCase()}`
        : typeId !== "default"
          ? `Instant ${type.label.toLowerCase()} delivery`
          : "Instant in-game credit";

  return {
    typeId,
    type,
    name,
    headline,
    subtitle,
    quantity,
    bonus,
    quantityLabel,
    tags,
    gameCode: context.gameCode || null,
    gameName: context.gameName || null,
    price: pkg?.amount ?? null,
    currency: pkg?.currency || null,
  };
}
