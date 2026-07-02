/** Synced from store API `currency` field when available. */
let storeCurrency = "MMK";

export function setStoreCurrency(currency) {
  if (currency) {
    storeCurrency = String(currency).toUpperCase();
  }
}

export function getStoreCurrency() {
  return storeCurrency;
}

/** Western digits (0–9) on all devices — avoid my-MM Myanmar numerals (၀၁၂…). */
export function formatNumber(value, options = {}) {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(value));
}

export function formatPrice(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) {
    return "—";
  }
  const code = (currency || storeCurrency || "MMK").toUpperCase();
  const value = Number(amount);

  if (code === "MMK") {
    return `${formatNumber(value)} MMK`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
