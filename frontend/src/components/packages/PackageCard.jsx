import { formatPrice } from "../../utils/format";
import { parsePackageDisplay } from "../../utils/packageDisplay";
import PackageIcon from "./PackageIcon";

export default function PackageCard({
  pkg,
  active = false,
  onSelect,
  gameCode,
  gameName,
  animationDelay = 0,
}) {
  const info = parsePackageDisplay(pkg, { gameCode, gameName });

  return (
    <button
      type="button"
      onClick={() => onSelect?.(pkg)}
      className={`package-card h-full w-full ${active ? "package-card--active" : ""}`}
      style={
        animationDelay
          ? {
              animationDelay: `${animationDelay}ms`,
              animationFillMode: "forwards",
            }
          : undefined
      }
      aria-pressed={active}
    >
      {active ? (
        <span className="package-card__badge" aria-hidden>
          Selected
        </span>
      ) : null}

      <div className="package-card__top">
        <div
          className={`package-card__icon-wrap bg-gradient-to-br ${info.type.accent} ring-1 ${info.type.ring}`}
        >
          <PackageIcon typeId={info.typeId} className={`h-8 w-8 ${info.type.iconColor}`} />
        </div>

        <div className="package-card__meta min-w-0 flex-1">
          {info.quantityLabel ? (
            <p className="package-card__quantity">{info.quantityLabel}</p>
          ) : null}
          <p className={`package-card__type ${info.type.iconColor}`}>{info.type.label}</p>
        </div>
      </div>

      <p className="package-card__name" title={info.name}>
        {info.name}
      </p>

      <p className="package-card__subtitle">{info.subtitle}</p>

      {info.tags.length > 0 ? (
        <ul className="package-card__tags" aria-label="Package highlights">
          {info.tags.map((tag) => (
            <li key={tag} className="package-card__tag">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="package-card__footer">
        <span className="package-card__price">{formatPrice(pkg.amount, pkg.currency)}</span>
        <span className="package-card__delivery">Instant</span>
      </div>
    </button>
  );
}

/** Compact row for order summary / receipts */
export function PackageSummaryRow({ pkg, gameCode, gameName, className = "" }) {
  if (!pkg) return null;
  const info = parsePackageDisplay(pkg, { gameCode, gameName });

  return (
    <div className={`package-summary-row ${className}`.trim()}>
      <div
        className={`package-summary-row__icon bg-gradient-to-br ${info.type.accent} ring-1 ${info.type.ring}`}
      >
        <PackageIcon typeId={info.typeId} className={`h-6 w-6 ${info.type.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{info.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{info.subtitle}</p>
      </div>
      <p className="shrink-0 text-base font-bold text-accent-light">
        {formatPrice(pkg.amount, pkg.currency)}
      </p>
    </div>
  );
}
