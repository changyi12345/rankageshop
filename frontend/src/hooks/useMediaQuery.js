import { useEffect, useState } from "react";

/**
 * @param {string} query — e.g. "(max-width: 1023px)" for below Tailwind `lg`
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Phone / tablet layout (sticky header + bottom tab bar). */
export function useIsMobileSite() {
  return useMediaQuery("(max-width: 1023px)");
}
