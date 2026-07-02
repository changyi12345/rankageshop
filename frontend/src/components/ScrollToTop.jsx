import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LEGACY_HASH_REDIRECTS } from "../config/siteNav";

/**
 * Scroll window to top on route changes.
 * Legacy /#section links on home redirect to dedicated pages.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (pathname === "/" && hash) {
      const id = hash.replace(/^#/, "");
      const target = LEGACY_HASH_REDIRECTS[id];
      if (target) {
        navigate(target, { replace: true });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash, navigate]);

  return null;
}
