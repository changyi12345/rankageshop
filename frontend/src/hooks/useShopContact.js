import { useEffect, useState } from "react";
import { fetchPublicShopSettings } from "../api/settings";
import { BRAND_DOMAIN } from "../constants/brand";

const FALLBACK_EMAIL = `support@${BRAND_DOMAIN}`;

let cached = null;
let cachePromise = null;

function normalizeTelegramUrl(value) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("t.me/")) return `https://${raw}`;
  if (raw.startsWith("@")) return `https://t.me/${raw.slice(1)}`;
  return `https://t.me/${raw}`;
}

function normalizeContact(data) {
  const email = (data?.contactEmail ?? "").trim() || FALLBACK_EMAIL;
  const phone = (data?.contactPhone ?? "").trim() || null;
  const telegram = normalizeTelegramUrl(data?.supportTelegram);
  const liveChatEnabled = data?.featureFlags?.liveChatEnabled !== false;
  const shopName = (data?.shopName ?? "").trim() || "RanKageShop";

  return { email, phone, telegram, liveChatEnabled, shopName };
}

async function loadContact() {
  if (cached) return cached;
  if (!cachePromise) {
    cachePromise = fetchPublicShopSettings()
      .then((data) => {
        cached = normalizeContact(data);
        return cached;
      })
      .catch(() => {
        cached = normalizeContact(null);
        return cached;
      });
  }
  return cachePromise;
}

export function useShopContact() {
  const [contact, setContact] = useState(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    loadContact().then((data) => {
      if (!cancelled) {
        setContact(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { contact, loading };
}

export function openLiveChat() {
  window.dispatchEvent(new CustomEvent("rankage:open-live-chat"));
  return true;
}
