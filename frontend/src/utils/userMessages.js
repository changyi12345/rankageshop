const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

const CODE_MESSAGES = {
  provider_insufficient_balance:
    "This top-up is temporarily unavailable. Your wallet was not charged. Please try again later or contact support.",
  insufficient_balance: "Insufficient wallet balance.",
  order_in_progress:
    "You already have an order in progress. Please wait until it completes before placing another order.",
};

const TECHNICAL_PATTERN =
  /g2bulk|\.env\b|vite_|api\.g2bulk|upstream|wholesale|\bmerchant\b|\bsupplier\b|catalogue_name|\bplayer_id\b|\buser_id\b|check email settings|traceback|django\.|nginx|502 bad gateway|bad gateway|internal server error/i;

const FIELD_REPLACEMENTS = [
  [/catalogue_name/gi, "package"],
  [/player_id/gi, "game ID"],
  [/user_id/gi, "game ID"],
  [/server_id/gi, "server"],
  [/order_id/gi, "order reference"],
];

function extractJsonMessage(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail.trim();
    }
    const valid =
      typeof parsed.valid === "string" ? parsed.valid.trim().toLowerCase() : "";
    const name = (parsed.name ?? "").toString().trim();
    if (valid === "invalid" || (!name && valid && valid !== "valid")) {
      return "No account found for this game ID. Check your ID and server, then try again.";
    }
    if (valid === "valid") {
      return name
        ? `Account found: ${name}`
        : "Game ID verified.";
    }
    if (!valid && name) {
      return `Account found: ${name}`;
    }
  } catch {
    /* not JSON */
  }
  return null;
}

/** Strip provider names, env/config jargon, and raw API noise from customer-facing copy. */
export function sanitizeUserMessage(message, options = {}) {
  const fallback = options.fallback || DEFAULT_FALLBACK;
  const code = options.code;

  if (code && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code];
  }

  if (message == null || message === "") {
    return fallback;
  }

  let text = typeof message === "string" ? message : String(message);
  text = text.trim();

  const jsonMessage = extractJsonMessage(text);
  if (jsonMessage) {
    text = jsonMessage;
  }

  text = text
    .replace(/^G2Bulk API error \(\d+\):\s*/i, "")
    .replace(/^\{"message":/i, "")
    .trim();

  if (!text || TECHNICAL_PATTERN.test(text)) {
    return fallback;
  }

  for (const [pattern, replacement] of FIELD_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  if (/^invalid$/i.test(text)) {
    return "No account found for this game ID. Check your ID and server, then try again.";
  }

  if (/^\{[\s\S]*\}$/.test(text)) {
    const fromJson = extractJsonMessage(text);
    if (fromJson) return fromJson;
    return fallback;
  }

  return text;
}
