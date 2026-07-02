import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentsIcon from "@mui/icons-material/Payments";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ImageIcon from "@mui/icons-material/Image";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";
import AdminPagination from "../../components/admin/AdminPagination";
import WalletTopupDetailModal, { getTopupStatusColor } from "../../components/admin/WalletTopupDetailModal";
import ReasonInputModal from "../../components/admin/ReasonInputModal";

const PAGE_SIZE_KEY = "admin-wallet-topups-page-size";

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

export default function WalletTopupsPage() {
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchTopups = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getWalletTopups();
      setTopups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch topups:", err);
      toast.error("Failed to load top-ups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTopups();
  }, [fetchTopups]);

  const stats = useMemo(() => {
    const pending = topups.filter((t) => t.status === "PENDING");
    const completed = topups.filter((t) => t.status === "COMPLETED");
    const rejected = topups.filter((t) => t.status === "REJECTED");
    const pendingAmount = pending.reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      total: topups.length,
      pending: pending.length,
      completed: completed.length,
      rejected: rejected.length,
      pendingAmount,
    };
  }, [topups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topups.filter((topup) => {
      if (statusFilter !== "all" && topup.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        topup.id,
        topup.user?.username,
        topup.username,
        topup.user?.email,
        topup.email,
        topup.reference,
        topup.description,
        topup.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [topups, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

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

  const verifyTopup = async (id) => {
    setActing(true);
    try {
      await adminApi.verifyWalletTopup(id);
      toast.success("Top-up verified — wallet credited");
      setSelectedTopup(null);
      fetchTopups(true);
    } catch {
      toast.error("Failed to verify top-up");
    } finally {
      setActing(false);
    }
  };

  const rejectTopup = (id) => setRejectTargetId(id);

  const confirmRejectTopup = async (reason) => {
    if (!rejectTargetId) return;
    setActing(true);
    try {
      await adminApi.rejectWalletTopup(rejectTargetId, reason);
      toast.success("Top-up rejected");
      setSelectedTopup(null);
      setRejectTargetId(null);
      fetchTopups(true);
    } catch {
      toast.error("Failed to reject top-up");
    } finally {
      setActing(false);
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
            Wallet Top-ups
          </h1>
          <p className="mt-2 text-blue-600">Manage wallet top-up requests</p>
        </div>
        <button
          type="button"
          onClick={() => fetchTopups(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={AccountBalanceWalletIcon} label="Total" value={stats.total} color="blue" />
        <StatCard icon={PendingActionsIcon} label="Pending" value={stats.pending} color="amber" />
        <StatCard icon={CheckCircleIcon} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={CancelIcon} label="Rejected" value={stats.rejected} color="red" />
        <StatCard
          icon={PaymentsIcon}
          label="Pending MMK"
          value={`${(stats.pendingAmount / 1000).toFixed(0)}K`}
          color="purple"
          title={`MMK ${stats.pendingAmount.toLocaleString()}`}
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
              placeholder="Search user, ID, reference, amount…"
              className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none transition-colors focus:border-blue-400"
            />
          </div>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">ID</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">User</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Proof</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Date</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((topup) => {
                const proofUrl = resolveUploadUrl(topup.proofImageUrl);
                const isPending = topup.status === "PENDING";

                return (
                  <tr
                    key={topup.id}
                    className="cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30"
                    onClick={() => setSelectedTopup(topup)}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-blue-900">#{topup.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[8rem] items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-sm font-bold text-white">
                          {(topup.user?.username ?? topup.username)?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-blue-900">
                            {topup.user?.username ?? topup.username ?? "-"}
                          </p>
                          <p className="truncate text-xs text-blue-500">
                            {topup.user?.email ?? topup.email ?? ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base font-extrabold text-blue-900">
                      MMK {(topup.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedTopup(topup)}
                          className="group relative block h-12 w-12 overflow-hidden rounded-xl border border-blue-200 bg-white"
                        >
                          <img
                            src={proofUrl}
                            alt="Proof"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-blue-950/0 transition-colors group-hover:bg-blue-950/30">
                            <ZoomHint />
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">
                          <ImageIcon sx={{ fontSize: 16 }} />
                          None
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`rounded-xl border px-3 py-1.5 text-xs font-black ${getTopupStatusColor(topup.status)}`}>
                        {topup.status || "PENDING"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-600">
                      {formatDateTime(topup.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTopup(topup)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                        >
                          <VisibilityIcon sx={{ fontSize: 14 }} />
                          View
                        </button>
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => verifyTopup(topup.id)}
                              disabled={acting}
                              className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectTopup(topup.id)}
                              disabled={acting}
                              className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-blue-600">
                    {topups.length === 0 ? "No top-up requests found" : "No top-ups match your filters"}
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

      {selectedTopup ? (
        <WalletTopupDetailModal
          topup={selectedTopup}
          onClose={() => setSelectedTopup(null)}
          onVerify={verifyTopup}
          onReject={rejectTopup}
          acting={acting}
        />
      ) : null}

      {rejectTargetId ? (
        <ReasonInputModal
          title="Reject top-up"
          message="The wallet top-up request will be rejected. The customer will not be credited."
          confirmLabel="Reject"
          loading={acting}
          onConfirm={confirmRejectTopup}
          onClose={() => !acting && setRejectTargetId(null)}
        />
      ) : null}
    </div>
  );
}

function ZoomHint() {
  return (
    <span className="rounded-full bg-white/90 p-1 text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
      <VisibilityIcon sx={{ fontSize: 14 }} />
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, title }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-slate-600 to-slate-800",
    green: "from-blue-500 to-blue-700",
    red: "from-slate-800 to-black",
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
