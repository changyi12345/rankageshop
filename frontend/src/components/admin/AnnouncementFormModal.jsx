import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

const EMPTY = {
  title: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
  startsAt: "",
  endsAt: "",
};

export default function AnnouncementFormModal({ announcement, onClose, onSaved }) {
  const isEdit = Boolean(announcement?.id);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!announcement) {
      setForm(EMPTY);
      return;
    }
    setForm({
      title: announcement.title || "",
      linkUrl: announcement.linkUrl || "",
      sortOrder: announcement.sortOrder ?? 0,
      isActive: announcement.isActive !== false,
      startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 10) : "",
      endsAt: announcement.endsAt ? announcement.endsAt.slice(0, 10) : "",
    });
  }, [announcement]);

  if (announcement === undefined) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Message is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        linkUrl: form.linkUrl.trim() || null,
        position: "announcement",
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };
      if (isEdit) {
        await adminApi.updateBanner(announcement.id, payload);
        toast.success("Announcement updated");
      } else {
        await adminApi.createBanner(payload);
        toast.success("Announcement created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-blue-900">
              {isEdit ? "Edit announcement" : "Add announcement"}
            </h2>
            <p className="mt-0.5 text-xs text-blue-500">Shown in the top scrolling bar on the shop</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-blue-500 hover:bg-blue-50" aria-label="Close">
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Message">
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Instant game delivery · Pay with local wallets"
                required
              />
              <p className="mt-1.5 text-xs text-blue-400">
                Add multiple lines as separate announcements, or use · between phrases in one line.
              </p>
            </Field>
            <Field label="Link URL (optional)">
              <input
                value={form.linkUrl}
                onChange={(e) => setField("linkUrl", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="https://"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (optional)">
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setField("startsAt", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </Field>
              <Field label="Ends (optional)">
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setField("endsAt", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>
          <div className="flex gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
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
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              <SaveIcon sx={{ fontSize: 16 }} />
              {saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-blue-500">{label}</span>
      {children}
    </label>
  );
}
