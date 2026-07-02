import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { adminApi } from "../../api/admin";
import AdminPageLoader from "../../components/admin/AdminPageLoader";
import { useAuth } from "../../context/AuthContext";
import { isAdminRole } from "../../utils/roles";
import { toast } from "react-toastify";

const INPUT =
  "w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [broadcast, setBroadcast] = useState({
    target: "all",
    username: "",
    title: "",
    body: "",
    url: "",
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!user || !isAdminRole(user.role)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getNotifications();
      setData(res.data);
    } catch (err) {
      if (err?.status !== 403) {
        toast.error("Failed to load notifications");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    const title = broadcast.title.trim();
    const body = broadcast.body.trim();
    if (!title || !body) {
      toast.error("Title and message are required");
      return;
    }
    if (broadcast.target === "user" && !broadcast.username.trim()) {
      toast.error("Enter a username");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title,
        body,
        url: broadcast.url.trim() || undefined,
        ...(broadcast.target === "all"
          ? { allUsers: true }
          : { username: broadcast.username.trim() }),
      };
      const res = await adminApi.sendNotifications(payload);
      const sent = res.data?.sent ?? 0;
      toast.success(`Notification sent to ${sent} user(s)`);
      setBroadcast((prev) => ({ ...prev, title: "", body: "", url: "" }));
    } catch (err) {
      toast.error(err?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) return <AdminPageLoader />;

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  const items = data?.items ?? [];

  const quickLinks = [
    { label: "Pending orders", value: data?.pendingOrders ?? 0, href: "/admin/orders?status=pending" },
    { label: "Wallet top-ups", value: data?.pendingWalletTopups ?? 0, href: "/admin/wallet-topups?status=PENDING" },
    { label: "Price alerts", value: data?.pendingG2bulkPriceAlerts ?? 0, href: "/admin/g2bulk" },
    ...(data?.g2bulkBalanceAlert
      ? [{ label: "Low G2Bulk balance", value: 1, href: "/admin/g2bulk" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Notifications
          </h1>
          <p className="mt-2 text-blue-600">{data?.totalPending ?? 0} items need your attention</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={sendBroadcast}
        className="rounded-3xl border border-blue-200/70 bg-white/90 p-6 shadow-xl shadow-blue-200/60"
      >
        <h2 className="mb-4 text-lg font-bold text-blue-900">Send notification to users</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Audience</span>
            <select
              className={INPUT}
              value={broadcast.target}
              onChange={(e) => setBroadcast((prev) => ({ ...prev, target: e.target.value }))}
            >
              <option value="all">All users</option>
              <option value="user">Specific username</option>
            </select>
          </label>
          {broadcast.target === "user" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-blue-700">Username</span>
              <input
                className={INPUT}
                value={broadcast.username}
                onChange={(e) => setBroadcast((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="customer_username"
              />
            </label>
          ) : (
            <div className="hidden lg:block" />
          )}
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Title</span>
            <input
              className={INPUT}
              value={broadcast.title}
              onChange={(e) => setBroadcast((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Maintenance tonight"
              maxLength={120}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Message</span>
            <textarea
              className={`${INPUT} min-h-[88px] resize-y`}
              value={broadcast.body}
              onChange={(e) => setBroadcast((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Write the notification message…"
              rows={3}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Link (optional)</span>
            <input
              className={INPUT}
              value={broadcast.url}
              onChange={(e) => setBroadcast((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="/wallet or https://rankage.shop/events"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <SendIcon sx={{ fontSize: 18 }} />
          {sending ? "Sending…" : "Send notification"}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-blue-900">{card.value}</p>
          </Link>
        ))}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="rounded-2xl border border-blue-200/70 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-blue-900">{item.title}</p>
                <p className="mt-1 text-sm text-blue-700">{item.message}</p>
                <p className="mt-2 text-xs text-blue-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                </p>
              </div>
              {item.href ? (
                <Link
                  to={item.href.replace("/admin/wallet", "/admin/wallet-topups")}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200"
                >
                  Review
                </Link>
              ) : null}
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-blue-200 p-10 text-center text-blue-600">
            All caught up — no pending notifications.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
