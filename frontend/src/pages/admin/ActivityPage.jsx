import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import TodayIcon from "@mui/icons-material/Today";
import CategoryIcon from "@mui/icons-material/Category";
import { adminApi } from "../../api/admin";
import AdminPagination from "../../components/admin/AdminPagination";
import { toast } from "react-toastify";

const PAGE_SIZE_KEY = "admin-activity-page-size";
const FETCH_LIMIT = 500;

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function ActivityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return saved > 0 ? saved : 20;
  });

  const fetchRows = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminApi.getActivityLogs(FETCH_LIMIT);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const entityTypes = useMemo(() => {
    const types = new Set(rows.map((r) => r.entity).filter(Boolean));
    return [...types].sort();
  }, [rows]);

  const stats = useMemo(() => {
    const today = rows.filter((r) => isToday(r.createdAt)).length;
    const entities = new Set(rows.map((r) => r.entity).filter(Boolean)).size;
    return { total: rows.length, today, entities };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (entityFilter !== "all" && row.entity !== entityFilter) return false;
      if (!q) return true;
      return [row.id, row.action, row.entity, row.entityId, row.detail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, entityFilter, pageSize]);

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
            Activity Log
          </h1>
          <p className="mt-2 text-blue-600">Recent admin actions and system events</p>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={HistoryIcon} label="Total entries" value={stats.total} color="blue" />
        <StatCard icon={TodayIcon} label="Today" value={stats.today} color="green" />
        <StatCard icon={CategoryIcon} label="Entity types" value={stats.entities} color="purple" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, detail…"
            className="w-full rounded-xl border border-blue-200 py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-800"
        >
          <option value="all">All entities</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {pageItems.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-blue-100 bg-white/90 px-5 py-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-blue-900">{row.action}</p>
                {row.entity ? (
                  <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    {row.entity}
                    {row.entityId != null ? ` #${row.entityId}` : ""}
                  </span>
                ) : null}
              </div>
              {row.detail ? <p className="mt-1 text-sm text-blue-600">{row.detail}</p> : null}
            </div>
            <p className="shrink-0 text-xs text-blue-400">{formatDateTime(row.createdAt)}</p>
          </li>
        ))}
        {pageItems.length === 0 ? (
          <li className="rounded-xl border border-dashed border-blue-200 p-10 text-center text-blue-600">
            {rows.length === 0 ? "No activity recorded yet" : "No entries match your filters"}
          </li>
        ) : null}
      </ul>

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
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-blue-500 to-blue-700",
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
