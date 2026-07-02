import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  isPublished: true,
  isPinned: false,
};

export default function EventFormModal({ event, onClose, onSaved }) {
  const isEdit = Boolean(event?.id);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!event) {
      setForm(EMPTY);
      return;
    }
    setForm({
      title: event.title || "",
      slug: event.slug || "",
      excerpt: event.excerpt || "",
      content: event.content || "",
      imageUrl: event.imageUrl || "",
      isPublished: event.isPublished !== false,
      isPinned: Boolean(event.isPinned),
    });
  }, [event]);

  if (event === undefined) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file);
      setField("imageUrl", res.data?.url || "");
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        isPublished: form.isPublished,
        isPinned: form.isPinned,
      };
      if (form.slug.trim()) payload.slug = form.slug.trim();
      if (isEdit) {
        await adminApi.updateEvent(event.id, payload);
        toast.success("Event updated");
      } else {
        await adminApi.createEvent(payload);
        toast.success("Event created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-blue-900">{isEdit ? "Edit event" : "Add event"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-blue-500 hover:bg-blue-50" aria-label="Close">
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" required />
            </Field>
            <Field label="Slug (optional)">
              <input value={form.slug} onChange={(e) => setField("slug", e.target.value)} className="w-full rounded-xl border border-blue-200 px-3 py-2.5 font-mono text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" placeholder="auto-generated if empty" />
            </Field>
            <Field label="Excerpt (optional)">
              <input value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" />
            </Field>
            <Field label="Content">
              <textarea value={form.content} onChange={(e) => setField("content", e.target.value)} rows={5} className="w-full resize-y rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" required />
            </Field>
            <Field label="Cover image (optional)">
              <div className="flex gap-2">
                <input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} className="w-full flex-1 rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-blue-900 outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 rounded-xl border border-blue-200 px-3 py-2 text-blue-700 hover:bg-blue-50">
                  <UploadIcon sx={{ fontSize: 18 }} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              {form.imageUrl ? (
                <img src={resolveUploadUrl(form.imageUrl)} alt="" className="mt-2 max-h-24 rounded-lg border border-blue-100 object-contain" />
              ) : null}
            </Field>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-800">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setField("isPublished", e.target.checked)} className="h-4 w-4" />
                Published
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-800">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => setField("isPinned", e.target.checked)} className="h-4 w-4" />
                Pinned
              </label>
            </div>
          </div>
          <div className="flex gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
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
