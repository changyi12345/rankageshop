import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";
import PromoFormModal from "../../components/admin/PromoFormModal";

const PAGE_SIZE_KEY = "admin-promos-page-size";

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function promoStatus(promo) {
  const now = new Date();
  if (!promo.isActive) return "inactive";
  if (promo.validUntil && new Date(promo.validUntil) < now) return "expired";
  if (promo.validFrom && new Date(promo.validFrom) > now) return "upcoming";
  return "active";
}

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editingPromo, setEditingPromo] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchPromos = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getAllPromos();
      setPromos(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load promos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const stats = useMemo(() => {
    const active = promos.filter((p) => promoStatus(p) === "active").length;
    const inactive = promos.filter((p) => promoStatus(p) === "inactive").length;
    const expired = promos.filter((p) => promoStatus(p) === "expired").length;
    const totalUsage = promos.reduce((sum, p) => sum + (p.usageCount ?? 0), 0);
    return { total: promos.length, active, inactive, expired, totalUsage };
  }, [promos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return promos.filter((promo) => {
      const status = promoStatus(promo);
      if (statusFilter === "active" && status !== "active") return false;
      if (statusFilter === "inactive" && status !== "inactive") return false;
      if (statusFilter === "expired" && status !== "expired") return false;
      if (!q) return true;
      return [promo.id, promo.code, promo.discountPercent]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [promos, search, statusFilter]);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActing(true);
    try {
      await adminApi.deletePromo(deleteTarget.id);
      toast.success("Promo deleted");
      setDeleteTarget(null);
      fetchPromos(true);
    } catch (err) {
      toast.error(err?.message || "Failed to delete promo");
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
            Promotions
          </h1>
          <p className="mt-2 text-blue-600">Manage discount codes and campaigns</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchPromos(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setEditingPromo(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:opacity-90"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            Add promo
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={LocalOfferIcon} label="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircleIcon} label="Active" value={stats.active} color="green" />
        <StatCard icon={CancelIcon} label="Inactive" value={stats.inactive} color="amber" />
        <StatCard icon={EventBusyIcon} label="Expired" value={stats.expired} color="red" />
        <StatCard icon={LocalOfferIcon} label="Total uses" value={stats.totalUsage} color="purple" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or ID…"
            className="w-full rounded-xl border border-blue-200 py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-800"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Code</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Discount</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Usage</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Valid period</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((promo) => {
                const status = promoStatus(promo);
                return (
                  <tr key={promo.id} className="hover:bg-blue-50/50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-mono font-bold text-blue-900">{promo.code}</p>
                      <p className="text-xs text-blue-400">#{promo.id}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-extrabold text-blue-900">
                      {promo.discountPercent}%
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-800">
                      {promo.usageCount ?? 0} / {promo.maxUsage}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-700">
                      {formatDate(promo.validFrom)} – {formatDate(promo.validUntil)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid w-[9rem] grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingPromo(promo)}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(promo)}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300"
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-blue-600">
                    {promos.length === 0 ? "No promotions yet" : "No promos match your filters"}
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
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            localStorage.setItem(PAGE_SIZE_KEY, String(size));
            setPage(1);
          }}
        />
      </div>

      {editingPromo !== undefined ? (
        <PromoFormModal
          promo={editingPromo}
          onClose={() => setEditingPromo(undefined)}
          onSaved={() => fetchPromos(true)}
        />
      ) : null}

      <AdminConfirmModal
        title={deleteTarget ? `Delete ${deleteTarget.code}?` : null}
        message="This promo code will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={acting}
        onConfirm={handleDelete}
        onClose={() => !acting && setDeleteTarget(null)}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "border-blue-200 bg-blue-100 text-blue-800",
    inactive: "border-gray-200 bg-gray-100 text-gray-700",
    expired: "border-slate-300 bg-slate-200 text-slate-800",
    upcoming: "border-slate-200 bg-slate-100 text-slate-700",
  };
  const labels = { active: "Active", inactive: "Inactive", expired: "Expired", upcoming: "Upcoming" };
  return (
    <span className={`rounded-xl border px-3 py-1 text-xs font-black ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-blue-500 to-blue-700",
    amber: "from-slate-600 to-slate-800",
    red: "from-slate-800 to-black",
    purple: "from-blue-600 to-blue-900",
  };
  return (
    <div className="rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm">
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
