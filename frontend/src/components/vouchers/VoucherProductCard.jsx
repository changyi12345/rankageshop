import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format";
import PackageIcon from "../packages/PackageIcon";

export default function VoucherProductCard({ product }) {
  const outOfStock = !product.in_stock || (product.stock != null && product.stock <= 0);

  return (
    <article className="package-card group h-full">
      <Link to={`/vouchers/${product.id}`} className="flex h-full flex-col">
        <div className="package-card__top">
          <div className="package-card__icon-wrap bg-gradient-to-br from-blue-500/20 to-blue-900/20 ring-1 ring-blue-400/30">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                className="h-8 w-8 rounded-lg object-cover sm:h-9 sm:w-9"
                loading="lazy"
              />
            ) : (
              <PackageIcon typeId="voucher" className="h-7 w-7" />
            )}
          </div>
          <div className="package-card__meta min-w-0">
            <p className="package-card__type text-accent-light">Voucher</p>
            <p className="package-card__quantity line-clamp-2">{product.title}</p>
          </div>
        </div>
        {product.face_value != null ? (
          <p className="mt-2 text-[10px] font-medium text-slate-500 sm:text-xs">
            Face value: {formatPrice(product.face_value, "USD")}
          </p>
        ) : null}
        <p className="package-card__name mt-2 line-clamp-2 text-slate-400">
          {product.category_title}
        </p>
        <div className="mt-auto pt-3">
          <p className="text-sm font-bold text-white sm:text-base">
            {formatPrice(product.unit_price, product.currency)}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {outOfStock ? "Out of stock" : "In stock"}
          </p>
        </div>
      </Link>
    </article>
  );
}
