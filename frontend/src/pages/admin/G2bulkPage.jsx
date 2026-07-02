import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import HubIcon from "@mui/icons-material/Hub";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InventoryIcon from "@mui/icons-material/Inventory";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import { adminApi } from "../../api/admin";
import AdminPageLoader from "../../components/admin/AdminPageLoader";
import AdminPagination from "../../components/admin/AdminPagination";
import { toast } from "react-toastify";

const PAGE_SIZE_KEY = "admin-g2bulk-page-size";

function formatUsd(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function txTypeLabel(type) {
  if (type === "add_balance") return "Top-up";
  if (type === "charge_balance") return "Charge";
  return type || "—";
}

export default function G2bulkPage() {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dismissingAll, setDismissingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 10;
  });

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [dashRes, alertRes] = await Promise.all([
        adminApi.getG2bulkDashboard(),
        adminApi.getG2bulkPriceAlerts(100),
      ]);
      setDashboard(dashRes.data);
      setAlerts(alertRes.data ?? []);
    } catch {
      toast.error("Failed to load G2Bulk data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter((alert) =>
      [alert.id, alert.label, alert.itemKey, alert.itemType, alert.increasePct]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [alerts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const runPriceCheck = async () => {
    setChecking(true);
    try {
      const res = await adminApi.checkG2bulkPrices(true);
      const result = res.data ?? {};
      if (result.error) {
        toast.warning(result.error);
      } else if (result.baselineOnly) {
        toast.info(
          `Baseline saved for ${result.checked} items. Run again later to detect price increases.`,
          { autoClose: 6000 }
        );
      } else {
        toast.success(
          `Checked ${result.checked} items — ${result.newAlerts} new alert(s), ${result.pricesUpdated} price(s) synced`
        );
      }
      await load(true);
    } catch (err) {
      toast.error(err?.message || "Price check failed");
    } finally {
      setChecking(false);
    }
  };

  const dismissAlert = async (id) => {
    try {
      await adminApi.dismissG2bulkPriceAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alert dismissed");
    } catch {
      toast.error("Could not dismiss alert");
    }
  };

  const dismissAll = async () => {
    setDismissingAll(true);
    try {
      await adminApi.dismissAllG2bulkPriceAlerts();
      setAlerts([]);
      toast.success("All alerts dismissed");
    } catch {
      toast.error("Could not dismiss alerts");
    } finally {
      setDismissingAll(false);
    }
  };

  if (loading) return <AdminPageLoader />;

  const profile = dashboard?.profile;
  const stats = dashboard?.stats ?? {};
  const monitoring = dashboard?.monitoring ?? {};
  const balanceAlert = dashboard?.balanceAlert;
  const connected = dashboard?.connected;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            G2Bulk
          </h1>
          <p className="mt-2 text-blue-600">Supplier balance and price monitoring</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/settings"
            state={{ tab: "g2bulk" }}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={runPriceCheck}
            disabled={checking || !connected}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {checking ? "Checking…" : "Run price check"}
          </button>
        </div>
      </div>

      {dashboard?.error ? (
        <div className="rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-800">
          <p className="font-bold">Connection issue</p>
          <p className="mt-1">{dashboard.error}</p>
          <p className="mt-2 text-xs text-slate-600">
            Add your API key in{" "}
            <Link to="/admin/settings" state={{ tab: "integrations" }} className="font-semibold text-blue-700 underline">
              Settings → Email &amp; API
            </Link>{" "}
            or set <code className="rounded bg-white px-1">G2BULK_API_KEY</code> in backend/.env, then restart the server.
          </p>
        </div>
      ) : null}

      {balanceAlert ? (
        <div className="rounded-2xl border border-slate-400 bg-slate-100 px-5 py-4 text-sm text-slate-900">
          <p className="font-bold">Low supplier balance</p>
          <p className="mt-1">
            Balance {formatUsd(balanceAlert.balance)} is below your {formatUsd(balanceAlert.threshold)} threshold.
            Top up your G2Bulk account to avoid fulfillment failures.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={HubIcon}
          label="Connection"
          value={connected ? "Connected" : "Not connected"}
          sub={profile?.username ? `@${profile.username}` : null}
          color={connected ? "green" : "red"}
        />
        <StatCard
          icon={AccountBalanceIcon}
          label="Balance (USD)"
          value={profile?.balance != null ? formatUsd(profile.balance) : "—"}
          sub={
            monitoring.lowBalanceThreshold
              ? `Alert below ${formatUsd(monitoring.lowBalanceThreshold)}`
              : "Set threshold in Settings"
          }
          color={balanceAlert ? "amber" : "blue"}
        />
        <StatCard
          icon={WarningAmberIcon}
          label="Price alerts"
          value={alerts.length}
          sub={`Min +${monitoring.priceAlertMinPct ?? 2}% / ${formatUsd(monitoring.priceAlertMinUsd ?? 0.25)}`}
          color="amber"
        />
        <StatCard
          icon={InventoryIcon}
          label="Tracked items"
          value={monitoring.snapshotCount ?? 0}
          sub={monitoring.autoPriceSync ? "Auto-sync on" : "Auto-sync off"}
          color="purple"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniStat icon={SportsEsportsIcon} label="Games" value={stats.gamesCount ?? 0} />
        <MiniStat icon={InventoryIcon} label="Voucher categories" value={stats.categoriesCount ?? 0} />
        <MiniStat icon={ReceiptLongIcon} label="Voucher products" value={stats.productsCount ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title="Recent supplier transactions" empty="No recent transactions">
          {(dashboard?.recentTransactions ?? []).slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3 border-b border-blue-50 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-900">{tx.description || txTypeLabel(tx.transaction_type)}</p>
                <p className="text-xs text-blue-400">{formatDate(tx.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.transaction_type === "add_balance" ? "text-blue-700" : "text-slate-700"}`}>
                  {tx.transaction_type === "add_balance" ? "+" : "−"}
                  {formatUsd(tx.amount)}
                </p>
                <p className="text-xs text-blue-400">{tx.status}</p>
              </div>
            </div>
          ))}
        </DataPanel>

        <DataPanel title="Recent supplier orders" empty="No recent orders">
          {(dashboard?.recentOrders ?? []).slice(0, 8).map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 border-b border-blue-50 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-900">{order.product_title}</p>
                <p className="text-xs text-blue-400">
                  #{order.id} · qty {order.quantity} · {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-900">{formatUsd(order.total_price)}</p>
                <p className="text-xs text-blue-400">{order.status}</p>
              </div>
            </div>
          ))}
        </DataPanel>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-blue-900">Price increase alerts</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts…"
                className="w-full rounded-xl border border-blue-200 py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {alerts.length > 0 ? (
              <button
                type="button"
                onClick={dismissAll}
                disabled={dismissingAll}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {dismissingAll ? "Dismissing…" : "Dismiss all"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-white to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-blue-700">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-blue-700">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-blue-700">Was → Now</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-blue-700">Change</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-blue-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {pageItems.map((alert) => (
                  <tr key={alert.id} className="hover:bg-blue-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-blue-900">{alert.label ?? alert.itemKey}</p>
                      <p className="text-xs text-blue-400">{formatDate(alert.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-blue-700">{alert.itemType || "—"}</td>
                    <td className="px-6 py-4 text-sm text-blue-800">
                      {formatUsd(alert.previousUsd)} → {formatUsd(alert.currentUsd)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">+{Number(alert.increasePct ?? 0).toFixed(1)}%</p>
                      <p className="text-xs text-blue-500">+{formatUsd(alert.increaseUsd)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200"
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageItems.length === 0 ? (
            <p className="px-6 py-10 text-center text-blue-600">
              {alerts.length === 0
                ? connected
                  ? "No price alerts — run a price check after the first baseline scan"
                  : "Connect G2Bulk to start monitoring"
                : "No alerts match your search"}
            </p>
          ) : null}
          {filtered.length > 0 ? (
            <AdminPagination
              page={safePage}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                localStorage.setItem(PAGE_SIZE_KEY, String(size));
                setPage(1);
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-blue-500 to-blue-700",
    amber: "from-slate-600 to-slate-800",
    purple: "from-blue-600 to-blue-900",
    red: "from-slate-800 to-black",
  };
  return (
    <div className="rounded-2xl border border-blue-200 bg-white/90 p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
          <Icon sx={{ fontSize: 20 }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-blue-500">{label}</p>
          <p className="mt-1 text-lg font-bold text-blue-900">{value}</p>
          {sub ? <p className="mt-0.5 truncate text-xs text-blue-400">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 px-5 py-4">
      <div className="flex items-center gap-3">
        <Icon sx={{ fontSize: 22 }} className="text-blue-500" />
        <div>
          <p className="text-xs font-bold uppercase text-blue-500">{label}</p>
          <p className="text-xl font-extrabold text-blue-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DataPanel({ title, empty, children }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean);
  return (
    <div className="rounded-3xl border border-blue-200/70 bg-white/90 p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-600">{title}</h3>
      {hasItems ? <div>{children}</div> : <p className="py-6 text-center text-sm text-blue-500">{empty}</p>}
    </div>
  );
}
