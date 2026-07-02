import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { isAdminRole } from "../../utils/roles";
import { useAdminNavStats } from "../../hooks/useAdminNavStats";
import AdminSidebar from "./AdminSidebar";
import AdminProfileMenu from "./AdminProfileMenu";

function AdminSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-blue-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function NotificationBadge({ count }) {
  if (!count) return <NotificationsIcon sx={{ fontSize: 24, color: "#2563EB" }} />;
  return (
    <span className="relative inline-flex">
      <NotificationsIcon sx={{ fontSize: 24, color: "#2563EB" }} />
      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { stats } = useAdminNavStats();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdminRole(user.role)) {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileSidebarOpen]);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const handleMenuClick = () => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setDesktopSidebarOpen((open) => !open);
      return;
    }
    setMobileSidebarOpen(true);
  };

  const handleLogout = () => {
    closeMobileSidebar();
    if (!logout()) return;
    navigate("/");
  };

  if (loading) {
    return <AdminSpinner />;
  }

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-blue-50">
      {mobileSidebarOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-blue-950/40 lg:hidden"
            onClick={closeMobileSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-blue-200 bg-white shadow-2xl lg:hidden">
            <AdminSidebar onNavigate={closeMobileSidebar} onLogout={handleLogout} />
          </aside>
        </>
      ) : null}

      <aside className={`${desktopSidebarOpen ? "hidden lg:block" : "hidden"} shrink-0`}>
        <div className="sticky top-0 h-screen">
          <AdminSidebar onLogout={handleLogout} desktop />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-blue-200/80 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl lg:px-7">
          <button
            type="button"
            onClick={handleMenuClick}
            className="rounded-xl p-3 text-blue-800 transition-all duration-200 hover:bg-blue-50"
            aria-label={desktopSidebarOpen ? "Hide admin menu" : "Show admin menu"}
            aria-expanded={mobileSidebarOpen || desktopSidebarOpen}
          >
            <MenuIcon sx={{ color: "#1E40AF" }} />
          </button>

          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-bold text-blue-900">Admin</p>
            <p className="truncate text-xs text-blue-500">{user.username}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/admin/notifications"
              className="rounded-xl p-3 text-blue-600 transition-all duration-200 hover:bg-blue-50"
              aria-label="Notifications"
            >
              <NotificationBadge count={stats.totalPending} />
            </Link>

            <div className="border-l border-blue-200 pl-3 sm:pl-4">
              <AdminProfileMenu onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
