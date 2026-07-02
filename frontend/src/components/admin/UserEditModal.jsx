import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: "USER",
    emailVerified: false,
    phoneVerified: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "USER",
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
    });
  }, [user]);

  if (!user) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateUser(user.id, {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        emailVerified: form.emailVerified,
        phoneVerified: form.phoneVerified,
      });
      toast.success("User updated");
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-blue-900">Edit user</h2>
            <p className="text-sm text-blue-500">#{user.id} — {user.username}</p>
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Username" required>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400"
                required
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400"
                required
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-blue-900 outline-none focus:border-blue-400"
              />
            </Field>

            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-900 outline-none focus:border-blue-400"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>

            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-blue-900">
                <input
                  type="checkbox"
                  checked={form.emailVerified}
                  onChange={(e) => setField("emailVerified", e.target.checked)}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600"
                />
                Email verified
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-blue-900">
                <input
                  type="checkbox"
                  checked={form.phoneVerified}
                  onChange={(e) => setField("phoneVerified", e.target.checked)}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600"
                />
                Phone verified
              </label>
            </div>
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              <SaveIcon sx={{ fontSize: 18 }} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-500">
        {label}
        {required ? <span className="text-slate-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
