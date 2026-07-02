import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyTopUps } from "../api/wallet";
import { HELP_PATH, WALLET_ADD_LABEL, WALLET_HISTORY_LABEL, WALLET_HISTORY_PATH, WALLET_TOPUP_PATH } from "../config/siteNav";
import RequireAuth from "../components/RequireAuth";
import { formatPrice } from "../utils/format";

const STATUS_LABELS = {
  pending: { text: "Pending", className: "wallet-status wallet-status--pending" },
  approved: { text: "Approved", className: "wallet-status wallet-status--approved" },
  rejected: { text: "Rejected", className: "wallet-status wallet-status--rejected" },
};

function formatMmk(amount) {
  return formatPrice(amount, "MMK");
}

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

function WalletHistoryContent() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = () => {
    setLoading(true);
    setError("");
    fetchMyTopUps()
      .then(setRows)
      .catch((err) => {
        setRows([]);
        setError(err.message || "Could not load top-up history.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRows();
  }, []);

  const totalApproved = rows
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <div className="site-container py-10 sm:py-14 lg:py-16">
      <div className="page-shell">
        <header className="wallet-history-page__header">
          <div className="min-w-0">
            <Link to={WALLET_TOPUP_PATH} className="text-sm text-accent-light hover:underline">
              ← {WALLET_ADD_LABEL}
            </Link>
            <h1 className="section-heading mt-4">{WALLET_HISTORY_LABEL}</h1>
            <p className="section-sub mt-2">Track wallet deposit requests and approval status.</p>
          </div>
          {!loading && rows.length > 0 ? (
            <div className="wallet-balance-banner wallet-balance-banner--inline shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Approved top-ups
              </span>
              <p className="text-xl font-bold text-accent-light sm:text-2xl">
                {formatMmk(totalApproved)}
              </p>
            </div>
          ) : null}
        </header>

        {loading ? (
          <p className="mt-10 text-slate-500">Loading…</p>
        ) : error ? (
          <div className="glass-panel mt-10 p-8 text-center">
            <p className="text-slate-300">{error}</p>
            <button type="button" className="btn-primary mt-6" onClick={loadRows}>
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-panel mt-10 p-8 text-center lg:p-12">
            <p className="text-slate-300">No top-ups yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              After you submit a wallet transfer, it appears here while our team reviews it.
            </p>
            <Link to={WALLET_TOPUP_PATH} className="btn-primary mt-6 inline-flex">
              {WALLET_ADD_LABEL}
            </Link>
            <Link to={HELP_PATH} className="btn-secondary mt-3 inline-flex">
              Help & support
            </Link>
          </div>
        ) : (
          <ul className="wallet-history-list">
            {rows.map((row) => {
              const st = STATUS_LABELS[row.status] || STATUS_LABELS.pending;
              return (
                <li key={row.id} className="glass-panel wallet-history-row p-5 sm:p-6">
                  <div className="wallet-history-row__body">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-white">{formatMmk(row.amount)}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {row.payment_method_name}
                        {row.transaction_last6 ? ` · Ref …${row.transaction_last6}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(row.created_at)}</p>
                    </div>
                    <span className={st.className}>{st.text}</span>
                  </div>
                  {row.admin_note && row.status === "rejected" ? (
                    <p className="mt-3 text-sm text-slate-400">{row.admin_note}</p>
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

export default function WalletHistoryPage() {
  return (
    <RequireAuth>
      <WalletHistoryContent />
    </RequireAuth>
  );
}
