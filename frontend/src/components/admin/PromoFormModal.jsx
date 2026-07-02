import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function defaultDates() {
  const from = new Date();
  const until = new Date();
  until.setMonth(until.getMonth() + 1);
  return { validFrom: toDateInput(from), validUntil: toDateInput(until) };
}

const EMPTY = {
  code: "",
  discountPercent: 10,
  maxUsage: 100,
  isActive: true,
  ...defaultDates(),
};

export default function PromoFormModal({ promo, onClose, onSaved }) {
  const isEdit = Boolean(promo?.id);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!promo) {
      setForm({ ...EMPTY, ...defaultDates() });
      return;
    }
    setForm({
      code: promo.code || "",
      discountPercent: promo.discountPercent ?? 10,
      maxUsage: promo.maxUsage ?? 100,
      validFrom: toDateInput(promo.validFrom),
      validUntil: toDateInput(promo.validUntil),
      isActive: promo.isActive !== false,
    });
  }, [promo]);

  if (promo === undefined) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = form.code.trim();
    if (!code) {
      toast.error("Promo code is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code,
        discountPercent: Number(form.discountPercent),
        maxUsage: Number(form.maxUsage),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        isActive: form.isActive,
      };
      if (isEdit) {
        await adminApi.updatePromo(promo.id, payload);
        toast.success("Promo updated");
      } else {
        await adminApi.createPromo(payload);
        toast.success("Promo created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save promo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-blue-900">{isEdit ? "Edit promo" : "Add promo"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-blue-500 hover:bg-blue-50" aria-label="Close">
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Code">
              <input
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-mono uppercase"
                placeholder="SUMMER2026"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount %">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setField("discountPercent", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm"
                  required
                />
              </Field>
              <Field label="Max usage">
                <input
                  type="number"
                  min={1}
                  value={form.maxUsage}
                  onChange={(e) => setField("maxUsage", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm"
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valid from">
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setField("validFrom", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm"
                  required
                />
              </Field>
              <Field label="Valid until">
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setField("validUntil", e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm"
                  required
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-blue-300"
              />
              Active
            </label>
            {isEdit ? (
              <p className="text-xs text-blue-500">
                Used {promo.usageCount ?? 0} / {promo.maxUsage ?? form.maxUsage} times
              </p>
            ) : null}
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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create promo"}
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
