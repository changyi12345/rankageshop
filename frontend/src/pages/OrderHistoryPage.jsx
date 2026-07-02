import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyOrders,
  isGameTopUpOrder,
  isVoucherOrder,
} from "../api/orders";
import {
  GAMES_PATH,
  ORDERS_HISTORY_LABEL,
  PROFILE_PATH,
  VOUCHERS_PATH,
} from "../config/siteNav";
import RequireAuth from "../components/RequireAuth";
import { formatPrice } from "../utils/format";
import { toast } from "../utils/toast";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "games", label: "Game top-ups" },
  { id: "vouchers", label: "Vouchers" },
];

const STATUS_LABELS = {
  PENDING: { text: "Pending", className: "wallet-status wallet-status--pending" },
  PAYMENT_PENDING: { text: "Awaiting payment", className: "wallet-status wallet-status--pending" },
  PROCESSING: { text: "Processing", className: "wallet-status wallet-status--pending" },
  COMPLETED: { text: "Completed", className: "wallet-status wallet-status--approved" },
  CANCELLED: { text: "Cancelled", className: "wallet-status wallet-status--rejected" },
  FAILED: { text: "Failed", className: "wallet-status wallet-status--rejected" },
  REFUNDED: { text: "Refunded", className: "wallet-status wallet-status--rejected" },
};

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

function orderTypeLabel(order) {
  if (isVoucherOrder(order)) return "Voucher";
  if (isGameTopUpOrder(order)) return "Game top-up";
  return "Order";
}

function CopyCodeButton({ code }) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied.");
    } catch {
      toast.error("Could not copy code.");
    }
  };

  return (
    <button type="button" className="btn-secondary py-1.5 px-3 text-xs" onClick={onCopy}>
      Copy
    </button>
  );
}

function OrderHistoryContent() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadRows = () => {
    setLoading(true);
    setError("");
    fetchMyOrders()
      .then(setRows)
      .catch((err) => {
        setRows([]);
        setError(err.message || "Could not load order history.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRows();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "games") return rows.filter(isGameTopUpOrder);
    if (filter === "vouchers") return rows.filter(isVoucherOrder);
    return rows;
  }, [rows, filter]);

  const completedTotal = filtered
    .filter((row) => row.status === "COMPLETED")
    .reduce((sum, row) => sum + Number(row.totalPrice || 0), 0);

  return (
    <div className="site-container py-10 sm:py-14 lg:py-16">
      <div className="page-shell">
        <header className="wallet-history-page__header">
          <div className="min-w-0">
            <Link to={PROFILE_PATH} className="text-sm text-accent-light hover:underline">
              ← Profile
            </Link>
            <h1 className="section-heading mt-4">{ORDERS_HISTORY_LABEL}</h1>
            <p className="section-sub mt-2">
              Game top-ups and voucher purchases — status, player IDs, and codes.
            </p>
          </div>
          {!loading && filtered.length > 0 ? (
            <div className="wallet-balance-banner wallet-balance-banner--inline shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed spend
              </span>
              <p className="text-xl font-bold text-accent-light sm:text-2xl">
                {formatPrice(completedTotal, "MMK")}
              </p>
            </div>
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

        {loading ? (
          <p className="mt-10 text-slate-500">Loading…</p>
        ) : error ? (
          <div className="glass-panel mt-10 p-8 text-center">
            <p className="text-slate-300">{error}</p>
            <button type="button" className="btn-primary mt-6" onClick={loadRows}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel mt-10 p-8 text-center lg:p-12">
            <p className="text-slate-300">No orders yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              {filter === "games"
                ? "Top up a game and your orders will appear here."
                : filter === "vouchers"
                  ? "Buy a voucher from the shop and it will show up here."
                  : "Browse games or vouchers to place your first order."}
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
              const statusKey = (row.status || "PENDING").toUpperCase();
              const st = STATUS_LABELS[statusKey] || STATUS_LABELS.PENDING;
              const title = row.topUpInput?.catalogueName || row.product?.name || `Order #${row.id}`;
              return (
                <li key={row.id} className="glass-panel wallet-history-row p-5 sm:p-6">
                  <div className="wallet-history-row__body">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-white">{title}</p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {orderTypeLabel(row)}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-accent-light">
                        {formatPrice(row.totalPrice, "MMK")}
                        {row.quantity > 1 ? (
                          <span className="ml-2 text-sm font-normal text-slate-500">
                            × {row.quantity}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Order #{row.id}
                        {row.paymentMethod ? ` · ${row.paymentMethod}` : ""}
                      </p>
                      {row.topUpInput ? (
                        <p className="mt-1 text-sm text-slate-400">
                          Player ID: {row.topUpInput.playerId}
                          {row.topUpInput.serverId ? ` · Server ${row.topUpInput.serverId}` : ""}
                          {row.topUpInput.playerName ? ` · ${row.topUpInput.playerName}` : ""}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">{formatDate(row.createdAt)}</p>
                    </div>
                    <span className={st.className}>{st.text}</span>
                  </div>

                  {row.voucherCodes?.length > 0 ? (
                    <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Voucher codes
                      </p>
                      {row.voucherCodes.map((code) => (
                        <div
                          key={code}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                        >
                          <code className="break-all text-sm text-white">{code}</code>
                          <CopyCodeButton code={code} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <RequireAuth>
      <OrderHistoryContent />
    </RequireAuth>
  );
}
