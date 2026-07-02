import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

const MaterialIcon = ({ name, className = "" }) => {
  const icons = {
    trending_up: (
      <svg className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    shopping_bag: (
      <svg className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    people: (
      <svg className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    inventory_2: (
      <svg className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    today: (
      <svg className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200";
    case "pending":
    case "payment_pending":
      return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const statsRes = await adminApi.getDashboardStats();
      const statsData = statsRes.data ?? {};
      setStats({
        totalSales: Number(statsData.totalSales ?? 0),
        totalOrders: statsData.totalOrders ?? 0,
        totalUsers: statsData.totalUsers ?? 0,
        totalProducts: statsData.totalProducts ?? 0,
        pendingOrders: statsData.pendingOrders ?? 0,
        pendingWalletTopups: statsData.pendingWalletTopups ?? 0,
        todayOrders: statsData.todayOrders ?? 0,
        todaySales: Number(statsData.todaySales ?? 0),
        activePromos: statsData.activePromos ?? 0,
        salesChart: Array.isArray(statsData.salesChart) ? statsData.salesChart : [],
        recentOrders: Array.isArray(statsData.recentOrders) ? statsData.recentOrders : [],
        g2bulkBalanceAlert: statsData.g2bulkBalanceAlert ?? null,
        g2bulkPriceAlertCount: statsData.g2bulkPriceAlertCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      toast.error("Failed to load dashboard");
      setStats({
        totalSales: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        pendingOrders: 0,
        pendingWalletTopups: 0,
        todayOrders: 0,
        todaySales: 0,
        activePromos: 0,
        salesChart: [],
        recentOrders: [],
        g2bulkBalanceAlert: null,
        g2bulkPriceAlertCount: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const chartMax = Math.max(...stats.salesChart.map((d) => d.amount), 1);

  const statsCards = [
    {
      label: "Total Sales",
      value: `MMK ${stats.totalSales.toLocaleString()}`,
      icon: "trending_up",
      href: "/admin/reports",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: "shopping_bag",
      href: "/admin/orders",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "people",
      href: "/admin/users",
    },
    {
      label: "Products",
      value: stats.totalProducts,
      icon: "inventory_2",
      href: "/admin/products",
    },
  ];

  const todayCards = [
    { label: "Today's orders", value: stats.todayOrders, href: "/admin/orders" },
    { label: "Today's sales", value: `MMK ${stats.todaySales.toLocaleString()}`, href: "/admin/reports" },
    { label: "Active promos", value: stats.activePromos, href: "/admin/promos" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-blue-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
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

      {(stats.pendingOrders > 0 || stats.pendingWalletTopups > 0 || stats.g2bulkBalanceAlert || stats.g2bulkPriceAlertCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingOrders > 0 ? (
            <Link to="/admin/orders?status=pending" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
              {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? "s" : ""} →
            </Link>
          ) : null}
          {stats.pendingWalletTopups > 0 ? (
            <Link to="/admin/wallet-topups?status=PENDING" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
              {stats.pendingWalletTopups} wallet top-up{stats.pendingWalletTopups !== 1 ? "s" : ""} →
            </Link>
          ) : null}
          {stats.g2bulkBalanceAlert ? (
            <Link to="/admin/g2bulk" className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-200">
              G2Bulk balance low (${Number(stats.g2bulkBalanceAlert.balance).toFixed(2)}) →
            </Link>
          ) : null}
          {stats.g2bulkPriceAlertCount > 0 ? (
            <Link to="/admin/g2bulk" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">
              {stats.g2bulkPriceAlertCount} G2Bulk price alert{stats.g2bulkPriceAlertCount !== 1 ? "s" : ""} →
            </Link>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {todayCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MaterialIcon name="today" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{card.label}</p>
                <p className="text-2xl font-black text-blue-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group rounded-3xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50 p-7 shadow-lg shadow-blue-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-blue-900">{stat.value}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-300/30 transition-all duration-300 group-hover:scale-110">
                <MaterialIcon name={stat.icon} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {stats.salesChart.length > 0 ? (
        <div className="rounded-3xl border border-blue-200/70 bg-white/90 p-7 shadow-xl shadow-blue-200/60">
          <h2 className="mb-6 text-xl font-bold text-blue-900">Sales — last 7 days</h2>
          <div className="flex items-end justify-between gap-2 sm:gap-4" style={{ minHeight: 160 }}>
            {stats.salesChart.map((point) => {
              const heightPct = point.amount > 0 ? Math.max((point.amount / chartMax) * 100, 8) : 4;
              return (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold text-blue-700">
                    {point.amount > 0 ? `${(point.amount / 1000).toFixed(0)}k` : "—"}
                  </span>
                  <div
                    className="w-full max-w-[3rem] rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                    style={{ height: `${heightPct}%`, minHeight: point.amount > 0 ? 24 : 8 }}
                    title={`MMK ${point.amount.toLocaleString()}`}
                  />
                  <span className="text-xs font-semibold text-blue-500">{point.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl shadow-blue-200/60">
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50/60 p-7">
          <h2 className="text-xl font-bold text-blue-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-7 py-5 text-left text-xs font-bold uppercase tracking-wider text-blue-700">ID</th>
                <th className="px-7 py-5 text-left text-xs font-bold uppercase tracking-wider text-blue-700">User</th>
                <th className="px-7 py-5 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Amount</th>
                <th className="px-7 py-5 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30">
                  <td className="whitespace-nowrap px-7 py-5 font-bold text-blue-900">
                    <Link to="/admin/orders" className="hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-7 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 font-bold text-white">
                        {order.customer?.charAt(0) || "U"}
                      </div>
                      <p className="text-sm font-semibold text-blue-900">{order.customer || "Unknown"}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-7 py-5 text-lg font-extrabold text-blue-900">
                    MMK {(order.total ?? 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-7 py-5">
                    <span className={`rounded-xl border px-4 py-2 text-xs font-black ${getStatusColor(order.status)}`}>
                      {order.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-7 py-10 text-center text-blue-600">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
