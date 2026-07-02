import { Link, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { ADMIN_NAV_SECTIONS } from "../../config/adminNav";
import { useAdminNavStats } from "../../hooks/useAdminNavStats";

function NavBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto min-w-[1.35rem] rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminSidebar({ onNavigate, onLogout, desktop = false }) {
  const location = useLocation();
  const { stats } = useAdminNavStats();

  const isActive = (path, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const badgeFor = (badgeKey) => {
    if (!badgeKey) return 0;
    return stats[badgeKey] ?? 0;
  };

  return (
    <div
      className={`flex h-full flex-col bg-gradient-to-br from-white to-blue-50 ${
        desktop ? "w-80" : "w-72"
      }`}
    >
      <div className="shrink-0 border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-200">
            <span className="text-2xl font-black text-white">R</span>
          </div>
          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-lg font-extrabold text-transparent">
              RanKageShop
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 admin-sidebar-scroll"
        aria-label="Admin navigation"
      >
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.path, item.end);
                const Icon = item.icon;
                const badge = badgeFor(item.badgeKey);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-200/80"
                        : "text-blue-800 hover:bg-blue-50/90"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active ? "bg-white/15" : "bg-blue-100/80 text-blue-700"
                      }`}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </span>
                    <span className={`flex-1 text-sm font-semibold ${active ? "text-white" : ""}`}>
                      {item.label}
                    </span>
                    <NavBadge count={badge} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-blue-100 bg-gradient-to-t from-white to-blue-50 p-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
        >
          <OpenInNewIcon sx={{ fontSize: 18 }} />
          View storefront
        </Link>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 lg:hidden"
        >
          <HomeIcon sx={{ fontSize: 18 }} />
          Back to store
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <LogoutIcon sx={{ fontSize: 18 }} />
          Logout
        </button>
      </div>
    </div>
  );
}
