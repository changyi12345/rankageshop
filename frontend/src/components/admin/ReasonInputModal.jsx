import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function ReasonInputModal({
  title,
  message,
  label = "Reason (optional)",
  placeholder = "Enter a reason…",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    setReason("");
  }, [title]);

  if (!title) return null;

  const buttonClass =
    variant === "warning"
      ? "from-slate-600 to-slate-800"
      : "from-slate-800 to-black";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-blue-100 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-blue-900">{title}</h2>
            {message ? <p className="mt-1 text-sm text-blue-600">{message}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-blue-500 hover:bg-blue-50"
            aria-label="Close"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="p-5">
          <label htmlFor="reason-input" className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-500">
            {label}
          </label>
          <textarea
            id="reason-input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none ring-blue-400 focus:ring-2"
          />
        </div>

        <div className="flex gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={loading}
            className={`flex-1 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 ${buttonClass}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
