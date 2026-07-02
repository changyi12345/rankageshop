import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
import HubIcon from "@mui/icons-material/Hub";
import HistoryIcon from "@mui/icons-material/History";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAuth } from "../../context/AuthContext";
import { useAdminNavStats } from "../../hooks/useAdminNavStats";

const QUICK_LINKS = [
  { path: "/admin", label: "Dashboard", icon: DashboardIcon },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCartIcon, badgeKey: "pendingOrders" },
  {
    path: "/admin/wallet-topups",
    label: "Wallet Top-ups",
    icon: AccountBalanceWalletIcon,
    badgeKey: "pendingWalletTopups",
  },
  {
    path: "/admin/notifications",
    label: "Notifications",
    icon: NotificationsActiveIcon,
    badgeKey: "totalPending",
  },
];

const TOOL_LINKS = [
  { path: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { path: "/admin/reports", label: "Reports", icon: BarChartIcon },
  { path: "/admin/g2bulk", label: "G2Bulk", icon: HubIcon, badgeKey: "g2bulkPriceAlertCount" },
  { path: "/admin/activity", label: "Activity Log", icon: HistoryIcon },
];

function MenuBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function MenuLink({ item, stats, onClose }) {
  const Icon = item.icon;
  const badge = item.badgeKey ? stats[item.badgeKey] ?? 0 : 0;
  return (
    <Link
      to={item.path}
      role="menuitem"
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50"
    >
      <Icon sx={{ fontSize: 18 }} className="text-blue-600" />
      <span>{item.label}</span>
      <MenuBadge count={badge} />
    </Link>
  );
}

export default function AdminProfileMenu({ onLogout }) {
  const { user } = useAuth();
  const { stats } = useAdminNavStats();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    onLogout?.();
  };

  const initial = user.username?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 transition-all hover:border-blue-100 hover:bg-blue-50/80"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-blue-900">{user.username}</p>
          <p className="text-xs text-blue-500">{user.role}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-base font-bold text-white shadow-lg shadow-blue-200">
          {initial}
        </div>
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 20,
            color: "#3B82F6",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
          className="hidden sm:block"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-xl shadow-blue-200/40"
        >
          <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 text-lg font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-blue-900">{user.username}</p>
                <p className="truncate text-xs text-blue-600">{user.email}</p>
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              {user.role}
            </span>
          </div>

          <div className="p-2">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Quick access
            </p>
            {QUICK_LINKS.map((item) => (
              <MenuLink key={item.path} item={item} stats={stats} onClose={close} />
            ))}
          </div>

          <div className="border-t border-blue-100 p-2">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Tools
            </p>
            {TOOL_LINKS.map((item) => (
              <MenuLink key={item.path} item={item} stats={stats} onClose={close} />
            ))}
          </div>

          <div className="border-t border-blue-100 p-2">
            <Link
              to="/"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50"
            >
              <OpenInNewIcon sx={{ fontSize: 18 }} className="text-blue-600" />
              View storefront
            </Link>
            <Link
              to="/admin/settings?tab=security"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-50"
            >
              <PersonIcon sx={{ fontSize: 18 }} className="text-blue-600" />
              Account &amp; security
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
