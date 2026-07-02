import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GAMES_PATH, NOTIFICATIONS_LABEL, PROFILE_PATH, VOUCHERS_PATH } from "../config/siteNav";
import RequireAuth from "../components/RequireAuth";
import { useNotifications } from "../context/NotificationsContext";
import { NavIcon } from "../components/nav/NavIcons";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function typeIcon(type) {
  switch (type) {
    case "wallet":
      return "wallet";
    case "order":
      return "orders";
    case "refund":
      return "wallet";
    case "promo":
      return "promo";
    default:
      return "info";
  }
}

function NotificationsContent() {
  const { items, loading, refreshAll, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((row) => !row.read);
    return items;
  }, [items, filter]);

  const unreadCount = items.filter((row) => !row.read).length;

  const onOpen = async (item) => {
    if (!item.read) {
      try {
        await markRead(item.id);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="site-container py-10 sm:py-14 lg:py-16">
      <div className="page-shell">
        <header className="wallet-history-page__header">
          <div className="min-w-0">
            <Link to={PROFILE_PATH} className="text-sm text-accent-light hover:underline">
              ← Profile
            </Link>
            <h1 className="section-heading mt-4">{NOTIFICATIONS_LABEL}</h1>
            <p className="section-sub mt-2">
              Order updates, wallet approvals, refunds, and announcements.
            </p>
          </div>
          {unreadCount > 0 ? (
            <button type="button" className="btn-secondary shrink-0" onClick={() => markAllRead()}>
              Mark all read
            </button>
          ) : null}
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                filter === item.id
                  ? "border-accent bg-accent/15 text-accent-light"
                  : "border-surface-border text-slate-400 hover:border-white/20 hover:text-white"
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && filtered.length === 0 ? (
          <p className="mt-10 text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="glass-panel mt-10 p-8 text-center lg:p-12">
            <p className="text-slate-300">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              You will be notified when orders complete or wallet top-ups are approved.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={GAMES_PATH} className="btn-primary">
                Browse games
              </Link>
              <Link to={VOUCHERS_PATH} className="btn-secondary">
                Voucher shop
              </Link>
            </div>
          </div>
        ) : (
          <ul className="wallet-history-list">
            {filtered.map((row) => {
              const inner = (
                <>
                  <span className="notification-page__icon">
                    <NavIcon name={typeIcon(row.type)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-white">{row.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{row.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDate(row.createdAt)}</p>
                      </div>
                      {!row.read ? (
                        <span className="wallet-status wallet-status--pending">New</span>
                      ) : null}
                    </div>
                  </span>
                </>
              );

              return (
                <li
                  key={row.id}
                  className={`glass-panel notification-page__row p-5 sm:p-6 ${
                    row.read ? "" : "notification-page__row--unread"
                  }`}
                >
                  {row.url ? (
                    <Link
                      to={row.url}
                      className="notification-page__link"
                      onClick={() => onOpen(row)}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="notification-page__link w-full text-left"
                      onClick={() => onOpen(row)}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function UserNotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}
