const iconClass = "h-7 w-7";

export default function PackageIcon({ typeId = "default", className = iconClass }) {
  const cls = className;

  switch (typeId) {
    case "diamond":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M10 12L16 4l6 8-6 14-6-14z"
            fill="#38bdf8"
            fillOpacity="0.35"
            stroke="#7dd3fc"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M6 18l4-6 6 10 6-10 4 6-10 8-10-8z"
            fill="#0ea5e9"
            fillOpacity="0.5"
            stroke="#38bdf8"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M10 12h12M16 4v8" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case "uc":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect
            x="5"
            y="8"
            width="14"
            height="18"
            rx="2"
            fill="#3b82f6"
            fillOpacity="0.25"
            stroke="#60a5fa"
            strokeWidth="1.25"
            transform="rotate(-8 12 17)"
          />
          <rect
            x="13"
            y="6"
            width="14"
            height="18"
            rx="2"
            fill="#2563eb"
            fillOpacity="0.35"
            stroke="#93c5fd"
            strokeWidth="1.25"
            transform="rotate(6 20 15)"
          />
          <text
            x="16"
            y="18"
            textAnchor="middle"
            fill="#dbeafe"
            fontSize="7"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            UC
          </text>
        </svg>
      );
    case "coin":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <ellipse cx="16" cy="24" rx="10" ry="3" fill="#3b82f6" fillOpacity="0.2" />
          <circle cx="16" cy="14" r="9" fill="#2563eb" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.25" />
          <circle cx="16" cy="14" r="5.5" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.6" />
          <path d="M16 10v8M13 14h6" stroke="#bfdbfe" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );
    case "gem":
    case "crystal":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M8 12h16l3 6-11 12L5 18l3-6z"
            fill="#3b82f6"
            fillOpacity="0.35"
            stroke="#60a5fa"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path d="M5 18h22M11 12l5 14 5-14M8 12l8-6 8 6" stroke="#93c5fd" strokeWidth="1" />
        </svg>
      );
    case "cp":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="6" y="7" width="20" height="18" rx="3" fill="#1d4ed8" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.25" />
          <path d="M11 14h10M11 18h7" stroke="#60a5fa" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="21" cy="18" r="1.5" fill="#93c5fd" />
        </svg>
      );
    case "vp":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 5l2.5 7.5H26l-6 4.5 2.3 7L16 19.5 9.7 24l2.3-7-6-4.5h7.5L16 5z"
            fill="#3b82f6"
            fillOpacity="0.25"
            stroke="#60a5fa"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "rp":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M10 6h8a5 5 0 010 10h-5v10h-3V6z"
            fill="#60a5fa"
            fillOpacity="0.25"
            stroke="#93c5fd"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path d="M13 11h4a2.5 2.5 0 110 5h-4" stroke="#bfdbfe" strokeWidth="1.25" />
        </svg>
      );
    case "token":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="8" y="5" width="16" height="22" rx="2" fill="#2563eb" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.25" />
          <circle cx="16" cy="16" r="4" stroke="#60a5fa" strokeWidth="1.25" />
        </svg>
      );
    case "pass":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M8 12h16v12a2 2 0 01-2 2H10a2 2 0 01-2-2V12z"
            fill="#3b82f6"
            fillOpacity="0.35"
            stroke="#60a5fa"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M8 12l8-6 8 6"
            fill="#2563eb"
            fillOpacity="0.4"
            stroke="#93c5fd"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <rect x="14" y="17" width="4" height="5" rx="0.5" fill="#dbeafe" fillOpacity="0.9" />
          <circle cx="16" cy="15" r="1.25" fill="#f8fafc" />
        </svg>
      );
    case "voucher":
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M6 11a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 010 4v3a2 2 0 01-2 2H8a2 2 0 01-2-2v-3a2 2 0 010-4v-3z"
            fill="#3b82f6"
            fillOpacity="0.15"
            stroke="#60a5fa"
            strokeWidth="1.25"
          />
          <path d="M16 9v14" stroke="#60a5fa" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 6l10 5.5v9L16 26 6 20.5v-9L16 6z"
            fill="#64748b"
            fillOpacity="0.2"
            stroke="#94a3b8"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
