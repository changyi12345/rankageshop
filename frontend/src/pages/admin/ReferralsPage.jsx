import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { adminApi } from "../../api/admin";
import AdminPagination from "../../components/admin/AdminPagination";
import { toast } from "react-toastify";

const PAGE_SIZE_KEY = "admin-referrals-page-size";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function ReferralsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchRows = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getReferralStats();
      const data = Array.isArray(res.data) ? res.data : res.data?.users ?? [];
      setRows(data);
    } catch {
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const stats = useMemo(() => {
    const withReferrals = rows.filter((r) => (r.referralCount ?? 0) > 0);
    const totalReferrals = rows.reduce((sum, r) => sum + (r.referralCount ?? 0), 0);
    const topCount = rows.length ? Math.max(...rows.map((r) => r.referralCount ?? 0)) : 0;
    return {
      referrers: rows.length,
      activeReferrers: withReferrals.length,
      totalReferrals,
      topCount,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.id, row.username, row.email, row.referralCode, row.referralCount]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

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
            Referrals
          </h1>
          <p className="mt-2 text-blue-600">Top referrers and referral codes</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PeopleIcon} label="Referrers" value={stats.referrers} color="blue" />
        <StatCard icon={CardGiftcardIcon} label="With referrals" value={stats.activeReferrers} color="green" />
        <StatCard icon={TrendingUpIcon} label="Total referrals" value={stats.totalReferrals} color="purple" />
        <StatCard icon={EmojiEventsIcon} label="Top referrer" value={stats.topCount} color="amber" />
      </div>

      <div className="relative rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm">
        <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user, email, or code…"
          className="w-full rounded-xl border border-blue-200 py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-white to-blue-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">User</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Referral code</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Referrals</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {pageItems.map((row) => (
                <tr key={row.id ?? row.username} className="hover:bg-blue-50/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-blue-900">{row.username ?? row.email}</p>
                    <p className="text-xs text-blue-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm font-bold text-blue-700">{row.referralCode ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-xl bg-blue-100 px-3 py-1 text-sm font-black text-blue-800">
                      {row.referralCount ?? row.referrals ?? 0}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-blue-600">
                    {formatDateTime(row.joinedAt ?? row.createdAt)}
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-blue-600">
                    {rows.length === 0 ? "No referral data yet" : "No results match your search"}
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-blue-500 to-blue-700",
    amber: "from-slate-600 to-slate-800",
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
