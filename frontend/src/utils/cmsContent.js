import { resolveMediaUrl, resolveUploadUrl } from "./mediaUrl";

export function resolveCmsImageUrl(path) {
  if (!path || path === "__announcement__") return null;
  return resolveUploadUrl(path) || resolveMediaUrl(path);
}

export function normalizeCmsLink(linkUrl, fallback = "/") {
  const raw = (linkUrl ?? "").trim();
  if (!raw) return { href: fallback, external: false };
  if (/^https?:\/\//i.test(raw)) return { href: raw, external: true };
  return { href: raw.startsWith("/") ? raw : `/${raw}`, external: false };
}

export function mapHeroBannerToSlide(banner) {
  const { href, external } = normalizeCmsLink(banner.linkUrl, "/promotions");
  return {
    id: `banner-${banner.id}`,
    type: "banner",
    typeLabel: "Promotion",
    title: banner.title || "Special offer",
    subtitle: "Tap to view details",
    imageUrl: resolveCmsImageUrl(banner.imageUrl),
    href,
    external,
    gradient: "from-violet-600/40 to-slate-900",
  };
}

export function formatEventDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
