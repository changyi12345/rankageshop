import { useCallback, useEffect, useState } from "react";
import { fetchWalletSummary } from "../api/wallet";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 30_000;

export function useWallet() {
  const { user } = useAuth();
  const userId = user?.id;
  const [summary, setSummary] = useState(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(userId));

  const refresh = useCallback(
    async ({ background = false } = {}) => {
      if (!userId) {
        setSummary(null);
        setInitialLoading(false);
        return null;
      }
      if (!background) {
        setInitialLoading(true);
      }
      try {
        const data = await fetchWalletSummary();
        setSummary(data);
        return data;
      } catch {
        if (!background) {
          setSummary(null);
        }
        return null;
      } finally {
        if (!background) {
          setInitialLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) {
      setSummary(null);
      setInitialLoading(false);
      return undefined;
    }

    refresh();

    const timer = window.setInterval(() => refresh({ background: true }), POLL_MS);
    const onFocus = () => refresh({ background: true });

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, refresh]);

  const balance =
    summary?.wallet_balance ??
    summary?.balance ??
    (user?.wallet_balance != null ? Number(user.wallet_balance) : 0);

  return {
    balance,
    currency: summary?.currency ?? "MMK",
    pendingTopUps: summary?.pending_top_ups ?? 0,
    loading: initialLoading,
    refresh,
  };
}
