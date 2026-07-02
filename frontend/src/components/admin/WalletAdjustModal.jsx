import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

function parseAmount(value) {
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export default function WalletAdjustModal({ user, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState("add");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAmount("");
    setNote("");
    setMode("add");
  }, [user]);

  if (!user) return null;

  const parsed = parseAmount(amount);
  const signedAmount = parsed == null ? null : mode === "deduct" ? -Math.abs(parsed) : Math.abs(parsed);
  const previewBalance =
    signedAmount == null ? user.walletBalance ?? 0 : (user.walletBalance ?? 0) + signedAmount;

  const applyQuick = (value) => {
    setAmount(String(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (signedAmount == null || signedAmount === 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (previewBalance < 0) {
      toast.error("Wallet balance cannot go below zero");
      return;
    }

    setSaving(true);
    try {
      await adminApi.adjustUserWallet(user.id, signedAmount, note.trim() || undefined);
      toast.success("Wallet adjusted");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to adjust wallet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
              <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-blue-900">Adjust wallet</h2>
              <p className="text-sm text-blue-500">{user.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Current balance</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">
              MMK {(user.walletBalance ?? 0).toLocaleString()}
            </p>
            {signedAmount != null && signedAmount !== 0 ? (
              <p className={`mt-2 text-sm font-semibold ${previewBalance < 0 ? "text-slate-700" : "text-blue-700"}`}>
                After: MMK {previewBalance.toLocaleString()}
                <span className="ml-1 text-blue-500">
                  ({signedAmount > 0 ? "+" : ""}
                  {signedAmount.toLocaleString()})
                </span>
              </p>
            ) : null}
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                mode === "add"
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              <AddIcon sx={{ fontSize: 18 }} />
              Add credit
            </button>
            <button
              type="button"
              onClick={() => setMode("deduct")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                mode === "deduct"
                  ? "border-slate-400 bg-slate-100 text-slate-800"
                  : "border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              <RemoveIcon sx={{ fontSize: 18 }} />
              Deduct
            </button>
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-500">
              Amount (MMK) <span className="text-slate-500">*</span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400"
              required
            />
          </label>

          <div className="mb-4 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => applyQuick(value)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
              >
                {value.toLocaleString()}
              </button>
            ))}
          </div>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-500">
              Note (optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Reason for adjustment…"
              className="w-full resize-none rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
