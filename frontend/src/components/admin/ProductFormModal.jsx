import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";

const INPUT =
  "w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    unitPrice: 0,
    stock: 0,
    description: "",
    imageUrl: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name || "",
      unitPrice: product.unitPrice ?? 0,
      stock: product.stock ?? 0,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      isActive: product.isActive !== false,
    });
  }, [product]);

  if (!product) return null;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file);
      const url = res.data?.url || res.data?.path;
      if (url) {
        setField("imageUrl", url);
        toast.success("Image uploaded");
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Product name is required");
      return;
    }
    const unitPrice = Number(form.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("Enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        unitPrice,
        stock: Number(form.stock) || 0,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
      };

      if (product.id) {
        await adminApi.updateProduct(product.id, payload);
      } else {
        await adminApi.createProduct({
          ...payload,
          type: product.type || "direct_topup",
          g2bulkGameCode: product.g2bulkGameCode || undefined,
          g2bulkProductId: product.g2bulkProductId ?? undefined,
        });
      }
      toast.success("Product saved");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save product");
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
          <h2 className="text-lg font-extrabold text-blue-900">
            {product.id ? `Edit product #${product.id}` : "Set product price"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          {product.g2bulkGameCode || product.categoryTitle ? (
            <p className="rounded-xl bg-blue-50 px-4 py-2 text-xs text-blue-600">
              {product.g2bulkGameCode
                ? `Game code: ${product.g2bulkGameCode}`
                : `Category: ${product.categoryTitle}`}
              {product.sourcePrice != null ? ` · Supplier: ${product.sourcePrice} ${product.sourceCurrency || "USD"}` : ""}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Name</span>
            <input className={INPUT} value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-blue-700">Price (MMK)</span>
              <input
                type="number"
                min={0}
                step={1}
                className={INPUT}
                value={form.unitPrice}
                onChange={(e) => setField("unitPrice", e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-blue-700">Stock</span>
              <input
                type="number"
                min={0}
                step={1}
                className={INPUT}
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-blue-700">Description</span>
            <textarea
              className={`${INPUT} min-h-[80px] resize-y`}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-semibold text-blue-700">Image</span>
            <div className="flex flex-wrap items-center gap-3">
              {form.imageUrl ? (
                <img
                  src={resolveUploadUrl(form.imageUrl)}
                  alt=""
                  className="h-16 w-16 rounded-xl border border-blue-100 object-cover"
                />
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                <UploadIcon sx={{ fontSize: 16 }} />
                {uploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-semibold text-blue-900">Visible in shop</span>
          </label>
        </form>

        <div className="flex gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <SaveIcon sx={{ fontSize: 18 }} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
