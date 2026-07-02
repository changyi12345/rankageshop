import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaymentsIcon from "@mui/icons-material/Payments";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import AdminPagination from "../../components/admin/AdminPagination";
import OrderDetailModal, { getStatusColor } from "../../components/admin/OrderDetailModal";

const PAGE_SIZE_KEY = "admin-orders-page-size";

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "PENDING", label: "Pending" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
];

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function orderAmount(order) {
  return order.totalPrice ?? order.totalAmount ?? 0;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchOrders = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getAllOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const paymentMethods = useMemo(() => {
    const methods = new Set(orders.map((o) => o.paymentMethod).filter(Boolean));
    return [...methods].sort();
  }, [orders]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => ["PENDING", "PAYMENT_PENDING"].includes(o.status)).length;
    const processing = orders.filter((o) => o.status === "PROCESSING").length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const revenue = orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + orderAmount(o), 0);
    return { total: orders.length, pending, processing, completed, revenue };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
      if (!q) return true;
      const haystack = [
        order.id,
        order.user?.username,
        order.user?.email,
        order.product?.name,
        order.paymentMethod,
        order.topUpInput?.playerId,
        order.topUpInput?.playerName,
        order.topUpInput?.gameCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentFilter, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const handlePageChange = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    localStorage.setItem(PAGE_SIZE_KEY, String(size));
    setPage(1);
  };

  const updateStatus = async (orderId, status) => {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      toast.success("Order status updated");
      fetchOrders(true);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Orders
          </h1>
          <p className="mt-2 text-blue-600">Manage all customer orders</p>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={ShoppingCartIcon} label="Total" value={stats.total} color="blue" />
        <StatCard icon={PendingActionsIcon} label="Pending" value={stats.pending} color="amber" />
        <StatCard icon={AutorenewIcon} label="Processing" value={stats.processing} color="cyan" />
        <StatCard icon={CheckCircleIcon} label="Completed" value={stats.completed} color="green" />
        <StatCard
          icon={PaymentsIcon}
          label="Revenue"
          value={`${(stats.revenue / 1000).toFixed(0)}K`}
          color="purple"
          title={`MMK ${stats.revenue.toLocaleString()}`}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl shadow-blue-200/60 backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-blue-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <SearchIcon
              sx={{ fontSize: 20 }}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, user, product, player ID…"
              className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none transition-colors focus:border-blue-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              <option value="all">All payments</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Order</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Customer</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Product</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Payment</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Date</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((order) => {
                const status = order.status?.toLowerCase();
                const canQuickProcess = ["pending", "payment_pending"].includes(status);
                const canQuickComplete = ["pending", "payment_pending", "processing"].includes(status);

                return (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-900">#{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[8rem] items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white">
                          {order.user?.username?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-blue-900">
                            {order.user?.username || "Unknown"}
                          </p>
                          {order.topUpInput?.playerId ? (
                            <p className="truncate text-xs text-blue-500">ID: {order.topUpInput.playerId}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[10rem] truncate px-5 py-4 text-sm text-blue-900">
                      {order.product?.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base font-extrabold text-blue-900">
                      MMK {orderAmount(order).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">
                        {order.paymentMethod || "-"}
                      </span>
                      {order.paymentProof ? (
                        <span className="ml-1 text-[10px] font-bold text-slate-600">proof</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`rounded-xl border px-3 py-1.5 text-xs font-black ${getStatusColor(order.status)}`}>
                        {order.status || "PENDING"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                        >
                          <VisibilityIcon sx={{ fontSize: 14 }} />
                          View
                        </button>
                        {canQuickProcess ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "PROCESSING")}
                            className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                          >
                            Process
                          </button>
                        ) : null}
                        {canQuickComplete ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "COMPLETED")}
                            className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
                          >
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-blue-600">
                    {orders.length === 0 ? "No orders found" : "No orders match your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {selectedOrderId ? (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdated={() => fetchOrders(true)}
        />
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, title }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-slate-600 to-slate-800",
    cyan: "from-blue-400 to-blue-600",
    green: "from-blue-500 to-blue-700",
    purple: "from-blue-600 to-blue-900",
  };

  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm" title={title}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
          <Icon sx={{ fontSize: 20 }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{label}</p>
          <p className="text-xl font-extrabold text-blue-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
