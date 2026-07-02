import { useCallback, useEffect, useState } from "react";
import { fetchWalletSummary } from "../api/wallet";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 30_000;

export function useWallet() {
  const { user, refreshUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(null);
      return null;
    }
    setLoading(true);
    try {
      const data = await fetchWalletSummary();
      setSummary(data);
      await refreshUser();
      return data;
    } catch {
      setSummary(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, refreshUser]);

  useEffect(() => {
    if (!user) {
      setSummary(null);
      return undefined;
    }

    refresh();

    const timer = window.setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, refresh]);

  const balance =
    summary?.wallet_balance ??
    summary?.balance ??
    (user?.wallet_balance != null ? Number(user.wallet_balance) : 0);

  return {
    balance,
    currency: summary?.currency ?? "MMK",
    pendingTopUps: summary?.pending_top_ups ?? 0,
    loading,
    refresh,
  };
}
