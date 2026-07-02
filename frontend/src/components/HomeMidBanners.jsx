import { Link } from "react-router-dom";
import { normalizeCmsLink, resolveCmsImageUrl } from "../utils/cmsContent";

function MidBannerCard({ banner }) {
  const imageUrl = resolveCmsImageUrl(banner.imageUrl);
  const { href, external } = normalizeCmsLink(banner.linkUrl, "/promotions");

  const inner = (
    <div className="group relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card shadow-glow transition-all duration-500 hover:-translate-y-1 hover:border-accent/40">
      <div className="relative aspect-[21/9] sm:aspect-[21/8]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={banner.title || "Promotion"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-surface-raised px-6">
            <p className="text-center text-lg font-bold text-white">{banner.title}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
        {banner.title ? (
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <p className="text-lg font-bold text-white sm:text-xl">{banner.title}</p>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return (
    <Link to={href} className="block">
      {inner}
    </Link>
  );
}

export default function HomeMidBanners({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section className="border-b border-surface-border py-10 sm:py-12">
      <div className="site-container space-y-4">
        {banners.map((banner) => (
          <MidBannerCard key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}
