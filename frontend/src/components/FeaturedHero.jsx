import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVoucherCategories } from "../api/vouchers";
import { LOGO_SRC } from "../constants/brand";
import { GAMES_PATH, VOUCHERS_PATH, WALLET_ADD_LABEL } from "../config/siteNav";
import { useAuth } from "../context/AuthContext";
import { useStoreGamesContext } from "../context/StoreGamesContext";
import { buildHeroSlides, filterHeroSlides } from "../utils/heroSlides";
import { mapHeroBannerToSlide } from "../utils/cmsContent";

const ROTATE_MS = 5500;

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "game", label: "Games" },
  { id: "voucher", label: "Vouchers" },
];

function HeroVisual({ slide, slides, activeIndex, onSelect }) {
  if (!slide) {
    return (
      <div className="glass-panel flex aspect-[16/10] items-center justify-center rounded-3xl sm:aspect-[16/11]">
        <p className="text-slate-400">Loading highlights…</p>
      </div>
    );
  }

  const slideLinkClass =
    "group relative block overflow-hidden rounded-3xl border border-white/10 shadow-glow";

  return (
    <div className="relative">
      {slide.external ? (
        <a
          href={slide.href}
          target="_blank"
          rel="noreferrer"
          className={slideLinkClass}
        >
          <HeroSlideFrames slides={slides} activeIndex={activeIndex} />
        </a>
      ) : (
        <Link to={slide.href} className={slideLinkClass}>
          <HeroSlideFrames slides={slides} activeIndex={activeIndex} />
        </Link>
      )}

      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`hero-slide-dot ${index === activeIndex ? "hero-slide-dot--active" : ""}`}
              aria-label={`Show ${item.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeroSlideFrames({ slides, activeIndex }) {
  return (
    <div className="relative aspect-[16/10] sm:aspect-[16/11]">
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={`hero-slide ${index === activeIndex ? "hero-slide--active" : ""}`}
          aria-hidden={index !== activeIndex}
        >
          <div
            className={`absolute inset-0 ${
              item.imageUrl ? "bg-surface-raised" : `bg-gradient-to-br ${item.gradient}`
            }`}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-softer group-hover:scale-[1.03]"
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : null}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <span className="inline-flex rounded-full border border-accent/35 bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-light">
              {item.typeLabel}
            </span>
            <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl lg:text-3xl">{item.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedHero({ heroBanners = [] }) {
  const { user, loading: authLoading } = useAuth();
  const { games, loading, error } = useStoreGamesContext();
  const [voucherCategories, setVoucherCategories] = useState([]);
  const [activeType, setActiveType] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVoucherCategories()
      .then((data) => {
        if (!cancelled) setVoucherCategories(data || []);
      })
      .catch(() => {
        if (!cancelled) setVoucherCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cmsSlides = useMemo(
    () => (heroBanners || []).map(mapHeroBannerToSlide).filter((s) => s.imageUrl),
    [heroBanners]
  );

  const usingCmsHero = cmsSlides.length > 0;

  const catalogSlides = useMemo(
    () => buildHeroSlides(games, voucherCategories),
    [games, voucherCategories]
  );

  const allSlides = useMemo(
    () => (usingCmsHero ? cmsSlides : catalogSlides),
    [usingCmsHero, cmsSlides, catalogSlides]
  );

  const slides = useMemo(() => {
    if (usingCmsHero) return allSlides;
    return filterHeroSlides(allSlides, activeType);
  }, [allSlides, activeType, usingCmsHero]);

  const slide = slides[activeIndex] ?? slides[0] ?? null;

  useEffect(() => {
    setActiveIndex(0);
  }, [activeType]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, activeType]);

  const featuredGames = games.filter((g) => g.image_url).slice(0, 3);
  const featuredVouchers = voucherCategories
    .filter((c) => c.image_url || c.title)
    .slice(0, 3);

  return (
    <section className="hero-mesh relative overflow-hidden border-b border-surface-border">
      <div className="hero-orb -left-24 top-0 h-72 w-72 bg-accent/25" aria-hidden />
      <div
        className="hero-orb -right-16 top-1/4 h-56 w-56 bg-accent-light/15 animate-delay-300"
        aria-hidden
      />

      <div className="site-container relative py-14 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="home-stagger home-stagger--1">
            <div className="inline-flex rounded-full border border-accent/35 bg-accent/10 p-1.5 shadow-glow backdrop-blur-sm">
              <img
                src={LOGO_SRC}
                alt="RanKageShop"
                className="h-10 w-10 rounded-full object-contain sm:h-11 sm:w-11"
                width={44}
                height={44}
              />
            </div>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient">Top up</span>
              <br />
              your favorite games
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
              PUBG, Mobile Legends, Free Fire, vouchers and more — fair MMK prices.
              Pay from your wallet and get instant delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!authLoading && !user ? (
                <>
                  <Link to="/register" className="btn-primary px-6 py-3">
                    Create account
                  </Link>
                  <Link to="/login" className="btn-secondary px-6 py-3">
                    Sign in
                  </Link>
                </>
              ) : (
                <Link to="/wallet/top-up" className="btn-primary px-6 py-3">
                  {WALLET_ADD_LABEL}
                </Link>
              )}
              <Link to={GAMES_PATH} className="btn-secondary px-6 py-3">
                All games
              </Link>
              <Link to={VOUCHERS_PATH} className="btn-secondary px-6 py-3">
                Vouchers
              </Link>
              {slide ? (
                slide.external ? (
                  <a
                    href={slide.href}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-4 py-3 text-accent-light"
                  >
                    {slide.title} →
                  </a>
                ) : (
                  <Link to={slide.href} className="btn-ghost px-4 py-3 text-accent-light">
                    {slide.title} →
                  </Link>
                )
              ) : null}
            </div>
            {!authLoading && !user ? (
              <p className="mt-3 text-sm text-slate-500">
                Register free to top up your wallet and buy packages.
              </p>
            ) : null}
            <dl className="mt-10 grid grid-cols-3 gap-4 sm:max-w-md">
              {[
                { label: "Games", value: loading ? "…" : `${games.length}+` },
                { label: "Vouchers", value: voucherCategories.length || "—" },
                { label: "Delivery", value: "Fast" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="home-stagger home-stagger--stat rounded-xl border border-surface-border bg-surface-card/60 px-3 py-3 text-center backdrop-blur-sm transition-all duration-500 ease-softer hover:border-accent/30 hover:bg-surface-card/80"
                  style={{ transitionDelay: `${220 + i * 70}ms` }}
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
            {!loading && error ? (
              <p className="mt-4 animate-fade-in text-sm text-slate-300">{error}</p>
            ) : null}
          </div>

          <div className="home-stagger home-stagger--2">
            {!usingCmsHero ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {TYPE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveType(tab.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-500 ease-softer ${
                      activeType === tab.id
                        ? "border-accent/50 bg-accent/15 text-accent-light"
                        : "border-surface-border bg-surface-raised/80 text-slate-400 hover:border-accent/30 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
            <HeroVisual
              slide={slide}
              slides={slides}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          </div>
        </div>

        {featuredGames.length > 0 ? (
          <div className="mt-12">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              Popular games
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {featuredGames.map((game, i) => (
                <li
                  key={game.code}
                  className="home-stagger home-stagger--card"
                  style={{ transitionDelay: `${320 + i * 90}ms` }}
                >
                  <Link
                    to={`/games/${game.code}`}
                    className="group glass-panel flex items-center gap-4 p-4 transition-all duration-500 ease-softer hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
                  >
                    <img
                      src={game.image_url}
                      alt={game.name || "Game cover"}
                      className="h-16 w-24 shrink-0 rounded-xl object-cover transition-transform duration-[900ms] ease-softer group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{game.name}</p>
                      <p className="text-sm text-accent-light transition-transform duration-300 group-hover:translate-x-0.5">
                        Top up now →
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {featuredVouchers.length > 0 ? (
          <div className="mt-8">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              Vouchers
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {featuredVouchers.map((category, i) => (
                <li
                  key={category.id}
                  className="home-stagger home-stagger--card"
                  style={{ transitionDelay: `${520 + i * 90}ms` }}
                >
                  <Link
                    to={`${VOUCHERS_PATH}?category=${category.id}`}
                    className="group glass-panel flex items-center gap-4 p-4 transition-all duration-500 ease-softer hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
                  >
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.title || "Voucher category"}
                        className="h-16 w-24 shrink-0 rounded-xl object-cover transition-transform duration-[900ms] ease-softer group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-gradient-to-br from-blue-600/30 to-slate-900 text-lg font-black text-white/40">
                        {(category.title || "V").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{category.title}</p>
                      <p className="text-sm text-accent-light transition-transform duration-300 group-hover:translate-x-0.5">
                        Shop now →
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
