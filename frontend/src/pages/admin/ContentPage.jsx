import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import EventIcon from "@mui/icons-material/Event";
import CampaignIcon from "@mui/icons-material/Campaign";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";
import AdminConfirmModal from "../../components/admin/AdminConfirmModal";
import AnnouncementFormModal from "../../components/admin/AnnouncementFormModal";
import BannerFormModal from "../../components/admin/BannerFormModal";
import EventFormModal from "../../components/admin/EventFormModal";

const TABS = [
  { id: "announcements", label: "Announcements" },
  { id: "banners", label: "Banners" },
  { id: "events", label: "Events" },
];

export default function ContentPage() {
  const [tab, setTab] = useState("announcements");
  const [banners, setBanners] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [editingAnnouncement, setEditingAnnouncement] = useState(undefined);
  const [editingBanner, setEditingBanner] = useState(undefined);
  const [editingEvent, setEditingEvent] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const announcements = useMemo(
    () => banners.filter((b) => b.position === "announcement"),
    [banners]
  );
  const imageBanners = useMemo(
    () => banners.filter((b) => b.position !== "announcement"),
    [banners]
  );

  const fetchContent = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [bRes, eRes] = await Promise.all([adminApi.getBanners(), adminApi.getEvents()]);
      setBanners(bRes.data ?? []);
      setEvents(eRes.data ?? []);
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const rows =
    tab === "announcements" ? announcements : tab === "banners" ? imageBanners : events;

  const stats = useMemo(
    () => ({
      announcements: announcements.length,
      activeAnnouncements: announcements.filter((b) => b.isActive).length,
      banners: imageBanners.length,
      activeBanners: imageBanners.filter((b) => b.isActive).length,
      events: events.length,
      publishedEvents: events.filter((e) => e.isPublished).length,
    }),
    [announcements, imageBanners, events]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.id, row.title, row.slug, row.position, row.excerpt, row.linkUrl]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActing(true);
    try {
      if (deleteTarget.type === "banner" || deleteTarget.type === "announcement") {
        await adminApi.deleteBanner(deleteTarget.id);
        toast.success(deleteTarget.type === "announcement" ? "Announcement deleted" : "Banner deleted");
      } else {
        await adminApi.deleteEvent(deleteTarget.id);
        toast.success("Event deleted");
      }
      setDeleteTarget(null);
      fetchContent(true);
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setActing(false);
    }
  };

  const openCreate = () => {
    if (tab === "announcements") setEditingAnnouncement(null);
    else if (tab === "banners") setEditingBanner(null);
    else setEditingEvent(null);
  };

  const addLabel =
    tab === "announcements" ? "announcement" : tab === "banners" ? "banner" : "event";

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
            Content
          </h1>
          <p className="mt-2 text-blue-600">
            {tab === "announcements"
              ? "Manage the scrolling text bar at the top of the shop"
              : tab === "banners"
                ? "Manage homepage image banners"
                : "Manage shop events and news"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchContent(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:opacity-90"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            Add {addLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tab === "announcements" ? (
          <>
            <StatCard icon={CampaignIcon} label="Announcements" value={stats.announcements} color="blue" />
            <StatCard icon={CampaignIcon} label="Active" value={stats.activeAnnouncements} color="green" />
            <StatCard icon={ImageIcon} label="Banners" value={stats.banners} color="purple" />
            <StatCard icon={EventIcon} label="Events" value={stats.events} color="amber" />
          </>
        ) : tab === "banners" ? (
          <>
            <StatCard icon={ImageIcon} label="Banners" value={stats.banners} color="blue" />
            <StatCard icon={ImageIcon} label="Active banners" value={stats.activeBanners} color="green" />
            <StatCard icon={CampaignIcon} label="Announcements" value={stats.announcements} color="purple" />
            <StatCard icon={EventIcon} label="Published events" value={stats.publishedEvents} color="amber" />
          </>
        ) : (
          <>
            <StatCard icon={EventIcon} label="Events" value={stats.events} color="blue" />
            <StatCard icon={EventIcon} label="Published" value={stats.publishedEvents} color="green" />
            <StatCard icon={CampaignIcon} label="Announcements" value={stats.announcements} color="purple" />
            <StatCard icon={ImageIcon} label="Banners" value={stats.banners} color="amber" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSearch("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === t.id
                  ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                  : "border border-blue-200 bg-white text-blue-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full rounded-xl border border-blue-200 py-2.5 pl-10 pr-4 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-white to-blue-50">
              <tr>
                {tab !== "announcements" ? (
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">
                    Preview
                  </th>
                ) : null}
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">
                  {tab === "announcements" ? "Message" : "Title"}
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">
                  {tab === "banners" ? "Position" : tab === "events" ? "Slug" : "Link"}
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Status</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/50">
                  {tab !== "announcements" ? (
                    <td className="px-5 py-4">
                      {row.imageUrl ? (
                        <img
                          src={resolveUploadUrl(row.imageUrl)}
                          alt=""
                          className="h-12 w-20 rounded-lg border border-blue-100 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-blue-400">—</span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    <p className="max-w-md font-semibold text-blue-900">{row.title}</p>
                    <p className="text-xs text-blue-400">#{row.id}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-blue-700">
                    {tab === "banners"
                      ? row.position
                      : tab === "events"
                        ? row.slug
                        : row.linkUrl || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        tab === "events"
                          ? row.isPublished
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                          : row.isActive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tab === "events"
                        ? row.isPublished
                          ? "Published"
                          : "Draft"
                        : row.isActive
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid w-[9rem] grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (tab === "announcements") setEditingAnnouncement(row);
                          else if (tab === "banners") setEditingBanner(row);
                          else setEditingEvent(row);
                        }}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: tab === "announcements" ? "announcement" : tab === "banners" ? "banner" : "event",
                            id: row.id,
                            title: row.title,
                          })
                        }
                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-300"
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={tab === "announcements" ? 4 : 5} className="px-5 py-12 text-center text-blue-600">
                    {rows.length === 0
                      ? tab === "announcements"
                        ? "No announcements yet — add one to control the top scrolling bar"
                        : `No ${tab} yet`
                      : "No results match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingAnnouncement !== undefined ? (
        <AnnouncementFormModal
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(undefined)}
          onSaved={() => fetchContent(true)}
        />
      ) : null}

      {editingBanner !== undefined ? (
        <BannerFormModal
          banner={editingBanner}
          onClose={() => setEditingBanner(undefined)}
          onSaved={() => fetchContent(true)}
        />
      ) : null}

      {editingEvent !== undefined ? (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(undefined)}
          onSaved={() => fetchContent(true)}
        />
      ) : null}

      <AdminConfirmModal
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : null}
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={acting}
        onConfirm={handleDelete}
        onClose={() => !acting && setDeleteTarget(null)}
      />
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
