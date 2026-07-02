import { useCallback, useEffect, useState } from "react";
import { fetchWalletSummary } from "../api/wallet";
import { useAuth } from "../context/AuthContext";

export function useWallet() {
  const { user } = useAuth();
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
      return data;
    } catch {
      setSummary(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const balance =
    summary?.wallet_balance ??
    (user?.wallet_balance != null ? Number(user.wallet_balance) : 0);

  return {
    balance,
    currency: summary?.currency ?? "MMK",
    pendingTopUps: summary?.pending_top_ups ?? 0,
    loading,
    refresh,
  };
}
