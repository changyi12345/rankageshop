/**
 * Region tab visuals — country flags + symbolic icons for non-country servers.
 */

const COUNTRY_ISO = {
  bd: "bd",
  br: "br",
  eu: "eu",
  id: "id",
  kh: "kh",
  my: "my",
  ph: "ph",
  ru: "ru",
  sg: "sg",
  th: "th",
  tr: "tr",
  tw: "tw",
  vn: "vn",
};

const SYMBOL_BY_REGION = {
  default: "home",
  global: "globe",
  exclusive: "gem",
  special: "star",
  sea: "globe-asia",
  asia: "globe-asia",
  sgmy: "flags-duo",
  latam: "globe-americas",
  me: "globe",
  na: "globe-americas",
  us: "globe-americas",
};

export function getRegionIconMeta(regionCode) {
  const code = (regionCode || "").trim().toLowerCase();

  if (code === "sgmy") {
    return { type: "flags", isos: ["sg", "my"] };
  }

  const iso = COUNTRY_ISO[code];
  if (iso) {
    return { type: "flag", iso };
  }

  return {
    type: "symbol",
    icon: SYMBOL_BY_REGION[code] || "globe",
  };
}

function flagUrl(iso, width = 40) {
  const code = iso.toLowerCase();
  return `https://flagcdn.com/w${width}/${code}.png`;
}

function FlagImg({ iso, size = 18, className = "" }) {
  const width = size;
  const height = Math.round(size * 0.72);
  return (
    <img
      src={flagUrl(iso, 40)}
      srcSet={`${flagUrl(iso, 80)} 2x`}
      alt=""
      aria-hidden
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-white/10 ${className}`}
    />
  );
}

function SymbolSvg({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "shrink-0 opacity-90",
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
        </svg>
      );
    case "gem":
      return (
        <svg {...common}>
          <path d="M4 8.5 7 4h10l3 4.5-8 11.5L4 8.5Z" />
          <path d="M4 8.5h16M9 4l3 16 3-16" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 3.5 2.2 4.8 5.3.7-3.9 3.6 1.1 5.2L12 15.8l-4.7 2 1.1-5.2-3.9-3.6 5.3-.7L12 3.5Z" />
        </svg>
      );
    case "globe-asia":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.8 4 6.2 4 9s-1.5 6.2-4 9c-2.5-2.8-4-6.2-4-9s1.5-6.2 4-9Z" />
          <path d="M6.5 8.5h11M6.5 15.5h11" />
        </svg>
      );
    case "globe-americas":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a18 18 0 0 1 0 18M12 3a18 18 0 0 0 0 18" />
          <path d="M7 8.5c2 1 4.5 1.2 7 .5M7 15.5c2-1 4.5-1.2 7-.5" />
        </svg>
      );
    case "globe":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a18 18 0 0 1 0 18M12 3a18 18 0 0 0 0 18" />
        </svg>
      );
  }
}

export default function RegionIcon({ regionCode, size = 18, className = "" }) {
  const meta = getRegionIconMeta(regionCode);

  if (meta.type === "flag") {
    return (
      <span className={`inline-flex ${className}`}>
        <FlagImg iso={meta.iso} size={size} />
      </span>
    );
  }

  if (meta.type === "flags") {
    return (
      <span className={`inline-flex items-center -space-x-1.5 ${className}`}>
        {meta.isos.map((iso) => (
          <FlagImg key={iso} iso={iso} size={size - 2} className="relative ring-2 ring-surface-raised" />
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex text-accent-light ${className}`}>
      <SymbolSvg name={meta.icon} size={size} />
    </span>
  );
}
