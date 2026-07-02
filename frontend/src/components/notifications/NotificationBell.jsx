import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NOTIFICATIONS_PATH } from "../../config/siteNav";
import { useNotifications } from "../../context/NotificationsContext";
import { NavIcon } from "../nav/NavIcons";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  } catch {
    return "";
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

export default function NotificationBell({ className = "" }) {
  const navigate = useNavigate();
  const { unreadCount, items, loading, refreshList, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    refreshList();
  }, [open, refreshList]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onSelect = async (item) => {
    if (!item.read) {
      try {
        await markRead(item.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (item.url) navigate(item.url);
  };

  const recent = items.slice(0, 8);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        className="header-icon-btn relative"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <NavIcon name="bell" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="notification-bell__badge" aria-hidden>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel" role="menu">
          <div className="notification-panel__header">
            <p className="notification-panel__title">Notifications</p>
            {unreadCount > 0 ? (
              <button type="button" className="notification-panel__action" onClick={() => markAllRead()}>
                Mark all read
              </button>
            ) : null}
          </div>

          {loading && recent.length === 0 ? (
            <p className="notification-panel__empty">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="notification-panel__empty">No notifications yet.</p>
          ) : (
            <ul className="notification-panel__list">
              {recent.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-panel__item ${item.read ? "" : "notification-panel__item--unread"}`}
                    onClick={() => onSelect(item)}
                  >
                    <span className="notification-panel__icon">
                      <NavIcon name={typeIcon(item.type)} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="notification-panel__item-title">{item.title}</span>
                      <span className="notification-panel__item-body">{item.body}</span>
                      <span className="notification-panel__item-time">{formatWhen(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="notification-panel__footer">
            <Link to={NOTIFICATIONS_PATH} className="notification-panel__view-all" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
