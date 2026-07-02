import { useEffect, useState } from "react";
import { fetchHomeContent } from "../api/content";

export function useHomeContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const content = await fetchHomeContent();
        if (!cancelled) setData(content);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    heroBanners: data?.heroBanners ?? [],
    midBanners: data?.midBanners ?? [],
    events: data?.events ?? [],
  };
}
