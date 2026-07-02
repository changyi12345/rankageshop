import { Link } from "react-router-dom";
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_TAGLINE, LOGO_SRC } from "../constants/brand";

const SIZES = {
  xs: { wrap: "h-8 w-8", img: "h-8 w-8", px: 32 },
  sm: { wrap: "h-10 w-10", img: "h-10 w-10", px: 40 },
  md: { wrap: "h-11 w-11", img: "h-11 w-11", px: 44 },
  header: { wrap: "h-12 w-12 sm:h-14 sm:w-14", img: "h-12 w-12 sm:h-14 sm:w-14", px: 56 },
  lg: { wrap: "h-16 w-16", img: "h-16 w-16", px: 64 },
  xl: { wrap: "h-20 w-20", img: "h-20 w-20", px: 80 },
  hero: { wrap: "h-24 w-24 sm:h-28 sm:w-28", img: "h-24 w-24 sm:h-28 sm:w-28", px: 112 },
};

export default function BrandLogo({
  size = "md",
  showWordmark = false,
  showTagline = false,
  subtitle,
  className = "",
  asLink = true,
  glow = true,
  prominent = false,
}) {
  const s = SIZES[size] || SIZES.md;
  const showSub = Boolean(showWordmark && (subtitle || showTagline));
  const subText = subtitle || (showTagline ? BRAND_TAGLINE : "");
  const wrapClass = [
    "brand-logo-wrap flex shrink-0 items-center justify-center rounded-full",
    s.wrap,
    glow ? "brand-logo-wrap--glow" : "",
    prominent ? "brand-logo-wrap--prominent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div
      className={`flex min-w-0 items-center ${showWordmark ? "gap-3" : ""} ${className}`}
    >
      <span className={wrapClass}>
        <img
          src={LOGO_SRC}
          alt={BRAND_FULL_NAME}
          className={`brand-logo-img object-contain ${s.img}`}
          width={s.px}
          height={s.px}
          decoding="async"
        />
      </span>
      {showWordmark ? (
        <span className="min-w-0 truncate text-left">
          <span className="block font-display text-base font-extrabold uppercase tracking-tight text-accent transition-colors group-hover:text-accent-light sm:text-lg">
            {BRAND_NAME}
          </span>
          {showSub ? (
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 transition-colors group-hover:text-slate-300 sm:text-[11px]">
              {subText}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="group inline-flex max-w-full" aria-label={`${BRAND_FULL_NAME} — home`}>
        {content}
      </Link>
    );
  }

  return content;
}
