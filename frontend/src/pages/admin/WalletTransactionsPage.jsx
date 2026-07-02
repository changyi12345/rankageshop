import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { adminApi } from "../../api/admin";
import AdminPagination from "../../components/admin/AdminPagination";
import { toast } from "react-toastify";

const PAGE_SIZE_KEY = "admin-wallet-txns-page-size";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "topup", label: "Top-up" },
  { value: "spend", label: "Spend" },
  { value: "refund", label: "Refund" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusColor(status) {
  switch (status) {
    case "COMPLETED":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "PENDING":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "REJECTED":
      return "border-gray-200 bg-gray-100 text-gray-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default function WalletTransactionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchRows = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getWalletTransactions(500);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load wallet transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const stats = useMemo(() => {
    const topups = rows.filter((r) => r.type === "topup" && r.status === "COMPLETED");
    const spends = rows.filter((r) => r.type === "spend" && r.status === "COMPLETED");
    return {
      total: rows.length,
      topupVolume: topups.reduce((s, r) => s + (r.amount || 0), 0),
      spendVolume: spends.reduce((s, r) => s + (r.amount || 0), 0),
      pending: rows.filter((r) => r.status === "PENDING").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return [row.id, row.username, row.email, row.type, row.status, row.description, row.reference]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

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
            Wallet Transactions
          </h1>
          <p className="mt-2 text-blue-600">Full ledger of wallet top-ups, spends, and refunds</p>
        </div>
        <button
          type="button"
          onClick={() => fetchRows(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={AccountBalanceWalletIcon} label="Transactions" value={stats.total} />
        <StatCard icon={TrendingUpIcon} label="Top-ups (completed)" value={`MMK ${stats.topupVolume.toLocaleString()}`} />
        <StatCard icon={TrendingDownIcon} label="Spends (completed)" value={`MMK ${stats.spendVolume.toLocaleString()}`} />
        <StatCard icon={AccountBalanceWalletIcon} label="Pending" value={stats.pending} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl shadow-blue-200/60">
        <div className="flex flex-col gap-4 border-b border-blue-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <SearchIcon sx={{ fontSize: 20 }} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, reference, description…"
              className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">ID</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">User</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Type</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Description</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-blue-50/50">
                  <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-900">#{row.id}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="font-semibold text-blue-900">{row.username || "-"}</p>
                    <p className="text-xs text-blue-500">{row.email || ""}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm capitalize text-blue-800">{row.type}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-extrabold text-blue-900">
                    {row.type === "spend" ? "-" : "+"}MMK {(row.amount || 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${statusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="max-w-[14rem] truncate px-5 py-4 text-sm text-blue-700" title={row.description || row.reference}>
                    {row.description || row.reference || "-"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-600">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-blue-600">
                    {rows.length === 0 ? "No transactions yet" : "No transactions match your filters"}
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
          onPageChange={(next) => {
            setPage(next);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            localStorage.setItem(PAGE_SIZE_KEY, String(size));
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Icon sx={{ fontSize: 20 }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500">{label}</p>
          <p className="text-lg font-extrabold text-blue-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
