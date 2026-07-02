import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { useAuth } from "./AuthContext";
import { registerWebPush } from "../utils/webPush";

const NotificationsContext = createContext(null);

const POLL_MS = 30_000;

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const pushRegisteredRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
      return count;
    } catch {
      return 0;
    }
  }, [user]);

  const refreshList = useCallback(async () => {
    if (!user) {
      setItems([]);
      return [];
    }
    setLoading(true);
    try {
      const rows = await fetchNotifications({ limit: 50 });
      setItems(rows);
      return rows;
    } catch {
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshUnreadCount(), refreshList()]);
  }, [refreshUnreadCount, refreshList]);

  const markRead = useCallback(async (id) => {
    const updated = await markNotificationRead(id);
    setItems((prev) => prev.map((row) => (row.id === id ? updated : row)));
    setUnreadCount((prev) => Math.max(0, prev - (updated.read ? 1 : 0)));
    return updated;
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((row) => ({ ...row, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setItems([]);
      pushRegisteredRef.current = false;
      return undefined;
    }

    refreshAll();

    const timer = window.setInterval(() => {
      refreshUnreadCount();
    }, POLL_MS);

    if (!pushRegisteredRef.current) {
      pushRegisteredRef.current = true;
      registerWebPush().catch(() => {});
    }

    return () => window.clearInterval(timer);
  }, [user, refreshAll, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        items,
        loading,
        refreshUnreadCount,
        refreshList,
        refreshAll,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
