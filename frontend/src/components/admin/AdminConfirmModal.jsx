import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const VARIANTS = {
  default: {
    icon: "text-blue-600 bg-blue-100",
    button: "from-blue-600 to-blue-500",
  },
  warning: {
    icon: "text-slate-600 bg-slate-100",
    button: "from-slate-600 to-slate-800",
  },
  danger: {
    icon: "text-slate-700 bg-slate-200",
    button: "from-slate-800 to-black",
  },
};

export default function AdminConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!title) return null;

  const styles = VARIANTS[variant] || VARIANTS.default;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
            <WarningAmberIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-extrabold text-blue-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-blue-500 hover:bg-blue-50"
                aria-label="Close"
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-blue-700">{message}</p>
          </div>
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
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 ${styles.button}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
