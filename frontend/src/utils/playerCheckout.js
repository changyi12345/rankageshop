import { sanitizeUserMessage } from "./userMessages";

const VERIFY_FALLBACK =
  "We couldn't verify this game ID. Check your ID and server, then try again.";

const VERIFY_INVALID_MESSAGE =
  "No account found for this game ID. Check your ID and server, then try again.";

function normalizeName(value) {
  const name = (value ?? "").toString().trim();
  return name || null;
}

function extractVerifyName(body) {
  if (!body || typeof body !== "object") return null;
  return normalizeName(body.name ?? body.player_name ?? body.playerName);
}

/** Flatten { data: { valid, name } } style envelopes from the provider API. */
export function unwrapVerifyPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  for (const key of ["data", "result", "player"]) {
    const nested = payload[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return { ...payload, ...nested };
    }
  }
  return payload;
}

/**
 * Whether the check-player response confirms an account.
 * HTTP 200 / success:true alone is not enough — honor valid:"invalid" first.
 */
export function isVerifySuccess(payload) {
  const body = unwrapVerifyPayload(payload);
  if (!body || typeof body !== "object") return false;

  const valid =
    typeof body.valid === "string" ? body.valid.trim().toLowerCase() : "";
  const name = extractVerifyName(body);

  if (valid === "invalid") return false;
  if (valid === "valid") return true;
  if (body.valid === true) return true;
  if (valid) return false;

  return Boolean(name);
}

/** Map check-player API payloads to customer-facing copy (never raw JSON / valid flags). */
export function messageFromVerifyPayload(payload) {
  const body = unwrapVerifyPayload(payload);
  if (!body || typeof body !== "object") {
    return VERIFY_FALLBACK;
  }

  const name = extractVerifyName(body);

  if (isVerifySuccess(body)) {
    return name ? `Account found: ${name}` : "Game ID verified.";
  }

  const valid =
    typeof body.valid === "string" ? body.valid.trim().toLowerCase() : "";
  if (valid === "invalid" || valid) {
    return VERIFY_INVALID_MESSAGE;
  }

  const raw =
    (typeof body.message === "string" && body.message) ||
    (typeof body.detail === "string" && body.detail) ||
    null;

  return sanitizeUserMessage(raw, { fallback: VERIFY_FALLBACK });
}

export function parseVerifyResult(result) {
  if (!result) {
    return { ok: false, message: VERIFY_FALLBACK, name: null };
  }

  if (typeof result === "string") {
    const message = sanitizeUserMessage(result, { fallback: VERIFY_FALLBACK });
    return { ok: false, message, name: null, raw: result };
  }

  const rawMessage =
    (typeof result.message === "string" && result.message) ||
    (typeof result.detail === "string" && result.detail) ||
    null;

  let payload = result;
  if (rawMessage && rawMessage.trim().startsWith("{")) {
    try {
      payload = JSON.parse(rawMessage);
    } catch {
      payload = result;
    }
  }

  const body = unwrapVerifyPayload(payload);
  const name = extractVerifyName(body);
  const ok = isVerifySuccess(body);

  if (ok) {
    return {
      ok: true,
      message: name ? `Account found: ${name}` : "Game ID verified.",
      name,
      raw: body,
    };
  }

  return {
    ok: false,
    message: messageFromVerifyPayload(body),
    name: null,
    raw: body,
  };
}

export function parseOrderResult(result) {
  const order = result?.order || result;
  const orderId = order?.id ?? result?.order_id ?? result?.primaryOrderId;
  const status = (order?.status ?? result?.status ?? "PENDING").toString();
  const playerName =
    order?.topUpInput?.playerName ??
    order?.player_name ??
    result?.player_name;
  const message = sanitizeUserMessage(result?.message, {
    fallback: orderId ? "Your top-up is being processed." : "Order submitted.",
  });

  return {
    orderId,
    status,
    playerName,
    message,
    catalogue: order?.topUpInput?.catalogueName ?? order?.catalogue,
    raw: result,
  };
}

export function normalizeOrderStatus(status) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS") return "completed";
  if (s === "FAILED" || s === "CANCELLED" || s === "REFUNDED") return "failed";
  if (s === "PROCESSING") return "processing";
  return "pending";
}
