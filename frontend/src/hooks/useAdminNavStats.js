import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api/admin";

const EMPTY = {
  pendingOrders: 0,
  pendingWalletTopups: 0,
  pendingChatMessages: 0,
  totalPending: 0,
  g2bulkPriceAlertCount: 0,
  todaySales: 0,
  todayOrders: 0,
  totalSales: 0,
};

export function useAdminNavStats({ pollMs = 60000 } = {}) {
  const [stats, setStats] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await adminApi.getDashboardStats();
      const data = res.data ?? {};
      setStats({
        pendingOrders: data.pendingOrders ?? 0,
        pendingWalletTopups: data.pendingWalletTopups ?? 0,
        pendingChatMessages: data.pendingChatMessages ?? 0,
        totalPending:
          (data.pendingOrders ?? 0) +
          (data.pendingWalletTopups ?? 0) +
          (data.pendingChatMessages ?? 0) +
          (data.g2bulkPriceAlertCount > 0 ? 1 : 0),
        g2bulkPriceAlertCount: data.g2bulkPriceAlertCount ?? 0,
        todaySales: data.todaySales ?? 0,
        todayOrders: data.todayOrders ?? 0,
        totalSales: data.totalSales ?? 0,
      });
    } catch {
      setStats(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return undefined;
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { stats, loading, refresh };
}
