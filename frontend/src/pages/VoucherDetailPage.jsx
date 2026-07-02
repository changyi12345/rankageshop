import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchVoucherProduct } from "../api/vouchers";
import VoucherCheckoutSection from "../components/vouchers/VoucherCheckoutSection";
import PackageIcon from "../components/packages/PackageIcon";
import { VOUCHERS_PATH } from "../config/siteNav";
import { formatPrice } from "../utils/format";
import { sanitizeUserMessage } from "../utils/userMessages";

export default function VoucherDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVoucherProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            sanitizeUserMessage(err.message, {
              fallback: "This voucher is not available.",
            })
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="site-container animate-fade-in py-12 sm:py-16">
        <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-square max-w-md rounded-3xl skeleton-shimmer" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="site-container py-20 text-center">
        <div className="glass-panel mx-auto max-w-md px-6 py-12">
          <p className="text-5xl" aria-hidden>
            🎟️
          </p>
          <h1 className="mt-4 text-xl font-bold text-white">Voucher not found</h1>
          <p className="mt-2 text-slate-400">{error || "This voucher is not in the catalog."}</p>
          <Link to={VOUCHERS_PATH} className="btn-primary mt-6 inline-flex">
            Back to vouchers
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = !product.in_stock || (product.stock != null && product.stock <= 0);

  return (
    <div className="site-container py-8 sm:py-12">
      <Link
        to={VOUCHERS_PATH}
        className="inline-flex items-center text-sm font-medium text-accent-light transition hover:text-white"
      >
        ← Back to vouchers
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start xl:gap-14">
        <div className="animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div className="cover-placeholder mx-auto aspect-square max-w-md overflow-hidden rounded-3xl border border-surface-border shadow-glow">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600/25 to-slate-900">
                <PackageIcon typeId="voucher" className="h-20 w-20" />
                <span className="mt-4 text-xs font-bold uppercase tracking-widest text-accent-light">
                  Voucher
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="animate-slide-up opacity-0" style={{ animationDelay: "80ms", animationFillMode: "forwards" }}>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">
            {product.category_title}
          </p>
          <h1 className="section-heading mt-2">{product.title}</h1>
          {product.description ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{product.description}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Instant digital voucher code — pay with your wallet and receive your code right away.
            </p>
          )}

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-card/60 px-4 py-3">
              <dt className="text-slate-500">Price</dt>
              <dd className="mt-1 text-lg font-bold text-white">
                {formatPrice(product.unit_price, product.currency)}
              </dd>
            </div>
            {product.face_value != null ? (
              <div className="rounded-xl border border-surface-border bg-surface-card/60 px-4 py-3">
                <dt className="text-slate-500">Face value</dt>
                <dd className="mt-1 text-lg font-bold text-white">
                  {formatPrice(product.face_value, "USD")}
                </dd>
              </div>
            ) : null}
            <div className="rounded-xl border border-surface-border bg-surface-card/60 px-4 py-3">
              <dt className="text-slate-500">Availability</dt>
              <dd className="mt-1 font-semibold text-white">
                {outOfStock ? "Out of stock" : `In stock (${product.stock ?? "—"})`}
              </dd>
            </div>
          </dl>

          <VoucherCheckoutSection product={product} />
        </div>
      </div>
    </div>
  );
}
