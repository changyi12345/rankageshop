import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  NOTIFICATIONS_LABEL,
  NOTIFICATIONS_PATH,
  PROFILE_PATH,
  GAMES_PATH,
  ORDERS_HISTORY_LABEL,
  ORDERS_HISTORY_PATH,
  VOUCHERS_PATH,
  WALLET_ADD_LABEL,
  WALLET_HISTORY_LABEL,
  WALLET_HISTORY_PATH,
  WALLET_TOPUP_PATH,
  catalogHref,
} from "../../config/siteNav";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../hooks/useWallet";
import UserAvatar from "../UserAvatar";
import { formatPrice } from "../../utils/format";

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function HeaderAccountMenu({ onNavigate }) {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();
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

  const displayName = user.username || user.email?.split("@")[0] || "Account";

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const handleLogout = () => {
    close();
    if (!logout()) return;
    navigate("/");
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="header-account-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar user={user} name={displayName} size="sm" className="header-account-trigger__avatar" />
        <span className="hidden max-w-[7rem] truncate sm:inline">{displayName}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="header-account-menu" role="menu">
          <p className="header-account-menu__meta">
            <span className="font-semibold text-white">{displayName}</span>
            {user.email ? (
              <span className="mt-0.5 block truncate text-xs text-slate-500">{user.email}</span>
            ) : null}
            <span className="mt-2 block text-sm font-semibold text-accent-light">
              {formatPrice(balance, "MMK")}
            </span>
          </p>
          <Link
            to={NOTIFICATIONS_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            {NOTIFICATIONS_LABEL}
          </Link>
          <Link
            to={PROFILE_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            Profile
          </Link>
          <Link
            to={WALLET_TOPUP_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            {WALLET_ADD_LABEL}
          </Link>
          <Link
            to={WALLET_HISTORY_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            {WALLET_HISTORY_LABEL}
          </Link>
          <Link
            to={ORDERS_HISTORY_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            {ORDERS_HISTORY_LABEL}
          </Link>
          <Link
            to={catalogHref}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            Top up a game
          </Link>
          <Link
            to={VOUCHERS_PATH}
            className="header-account-menu__item"
            role="menuitem"
            onClick={close}
          >
            Voucher shop
          </Link>
          <button
            type="button"
            className="header-account-menu__item header-account-menu__item--danger w-full text-left"
            role="menuitem"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
