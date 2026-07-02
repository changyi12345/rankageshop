import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import BlockIcon from "@mui/icons-material/Block";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

export default function BanUserModal({ user, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason("");
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.banUser(user.id, reason.trim() || undefined);
      toast.success(`${user.username} has been banned`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to ban user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-100 to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
              <BlockIcon />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-blue-900">Ban user</h2>
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
          <p className="mb-4 text-sm text-blue-700">
            Banned users cannot log in or use the shop. They will see your ban reason if provided.
          </p>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-500">
              Reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Fraudulent payment proof"
              className="w-full resize-none rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-slate-400"
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
              className="flex-1 rounded-xl bg-gradient-to-r from-slate-800 to-black px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Banning…" : "Ban user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
