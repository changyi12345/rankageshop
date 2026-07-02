import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchPublicShopSettings } from "../api/settings";
import { BRAND_DOMAIN } from "../constants/brand";

const POLL_MS = 60_000;
const FALLBACK_EMAIL = `support@${BRAND_DOMAIN}`;

const ShopSettingsContext = createContext(null);

function normalizeTelegramUrl(value) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("t.me/")) return `https://${raw}`;
  if (raw.startsWith("@")) return `https://t.me/${raw.slice(1)}`;
  return `https://t.me/${raw}`;
}

function normalizeSettings(data) {
  const shopName = (data?.shopName ?? "").trim() || "RanKageShop";
  const maintenanceMode = Boolean(data?.maintenanceMode);
  const maintenanceMessage =
    (data?.maintenanceMessage ?? "").trim() ||
    "We're performing scheduled maintenance. New orders and wallet top-ups are temporarily unavailable. Please check back soon.";

  return {
    shopName,
    maintenanceMode,
    maintenanceMessage,
    contact: {
      email: (data?.contactEmail ?? "").trim() || FALLBACK_EMAIL,
      phone: (data?.contactPhone ?? "").trim() || null,
      telegram: normalizeTelegramUrl(data?.supportTelegram),
      liveChatEnabled: data?.featureFlags?.liveChatEnabled !== false,
      shopName,
    },
  };
}

const DEFAULT_SETTINGS = normalizeSettings(null);

export function ShopSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPublicShopSettings();
      setSettings(normalizeSettings(data));
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    const onMaintenance = () => refresh();
    window.addEventListener("rankage:maintenance", onMaintenance);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("rankage:maintenance", onMaintenance);
    };
  }, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("maintenance-active", settings.maintenanceMode);
    return () => document.documentElement.classList.remove("maintenance-active");
  }, [settings.maintenanceMode]);

  return (
    <ShopSettingsContext.Provider value={{ ...settings, loading, refresh }}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const ctx = useContext(ShopSettingsContext);
  if (!ctx) {
    throw new Error("useShopSettings must be used within ShopSettingsProvider");
  }
  return ctx;
}

export function useMaintenanceMode() {
  const { maintenanceMode, maintenanceMessage, shopName, loading } = useShopSettings();
  return { maintenanceMode, maintenanceMessage, shopName, loading };
}
