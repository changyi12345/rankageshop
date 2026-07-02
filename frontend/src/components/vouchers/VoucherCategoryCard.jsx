import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format";
import { VOUCHERS_PATH } from "../../config/siteNav";

export default function VoucherCategoryCard({ category }) {
  const priceLabel =
    category.min_price_mmk != null
      ? `From ${formatPrice(category.min_price_mmk)}`
      : `${category.product_count} item${category.product_count === 1 ? "" : "s"}`;

  return (
    <Link
      to={`${VOUCHERS_PATH}?category=${category.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-surface-card/80 p-3 transition-all duration-300 hover:border-accent/35 hover:bg-surface-card hover:shadow-glow sm:gap-4 sm:p-4"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-border bg-surface-raised sm:h-16 sm:w-16">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600/25 to-slate-900 text-sm font-black text-white/30">
            {(category.title || "?").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white group-hover:text-accent-light sm:text-base">
          {category.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{priceLabel}</p>
      </div>
      <span className="shrink-0 text-slate-500 transition group-hover:text-accent-light" aria-hidden>
        →
      </span>
    </Link>
  );
}
