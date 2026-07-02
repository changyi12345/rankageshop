import { toast } from "../utils/toast";

function CopyIcon() {
  return (
    <svg
      className="copyable-text__icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Inline value with a copy-to-clipboard button (stops click propagation for parent cards).
 */
export default function CopyableText({
  value,
  className = "",
  textClassName = "",
  copyLabel = "Copy number",
  showLabel = true,
}) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return null;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <span className={`copyable-text ${className}`.trim()}>
      <span className={`copyable-text__value ${textClassName}`.trim()}>{text}</span>
      <button
        type="button"
        className="copyable-text__btn"
        onClick={handleCopy}
        aria-label={`${copyLabel}: ${text}`}
        title={copyLabel}
      >
        <CopyIcon />
        {showLabel ? <span className="copyable-text__btn-label">Copy</span> : null}
      </button>
    </span>
  );
}
