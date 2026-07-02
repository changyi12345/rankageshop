import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GAMES_PATH } from "../config/siteNav";
import GameCard from "../components/GameCard";
import PackageCatalog from "../components/packages/PackageCatalog";
import PlayerCheckoutSection from "../components/checkout/PlayerCheckoutSection";
import RegionIcon from "../components/RegionIcon";
import { fetchStoreGame } from "../api/store";
import { useStoreGamesContext } from "../context/StoreGamesContext";
import { isMlbbUnified, MLBB_REGIONS, resolveMlbbRegionFromCode, isMlbbVariant } from "../utils/mlbb-regions";
import { gradientForCode } from "../utils/gradients";
import { sanitizeUserMessage } from "../utils/userMessages";
import { fetchWithRetry } from "../utils/fetchWithRetry";

function regionKey(region) {
  return (region || "default").toLowerCase();
}

function pickDefaultPackage(packages) {
  return packages?.length ? packages[0] : null;
}

export default function GameDetailPage() {
  const { gameId: gameCode } = useParams();
  const { games } = useStoreGamesContext();

  const [detail, setDetail] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [regionLoading, setRegionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);

  const regionCacheRef = useRef(new Map());
  const fetchGenRef = useRef(0);

  const applyRegionData = useCallback((data, regionCode) => {
    const key = regionKey(data.active_region || regionCode);
    regionCacheRef.current.set(key, data);
    setDetail(data);
    setActiveRegion(data.active_region || regionCode || null);
    setSelectedPackage(pickDefaultPackage(data.packages));
    setError(null);
  }, []);

  const loadRegion = useCallback(
    async (region, { initial = false, useRetry = false } = {}) => {
      const key = regionKey(region);
      const cached = regionCacheRef.current.get(key);
      if (cached) {
        applyRegionData(cached, region);
        return;
      }

      const generation = ++fetchGenRef.current;
      if (initial) {
        setInitialLoading(true);
      } else {
        setRegionLoading(true);
      }

      try {
        const fetcher = () => fetchStoreGame(gameCode, region);
        const data = useRetry
          ? await fetchWithRetry(fetcher, { retries: 2, initialDelayMs: 500 })
          : await fetcher();

        if (generation !== fetchGenRef.current) return;
        applyRegionData(data, region);
      } catch (err) {
        if (generation !== fetchGenRef.current) return;
        if (initial) {
          setError(
            sanitizeUserMessage(err.message, {
              fallback: "This game is not available right now.",
            })
          );
        }
      } finally {
        if (generation === fetchGenRef.current) {
          setInitialLoading(false);
          setRegionLoading(false);
        }
      }
    },
    [applyRegionData, gameCode]
  );

  useEffect(() => {
    regionCacheRef.current = new Map();
    fetchGenRef.current += 1;
    setDetail(null);
    setError(null);
    setSelectedPackage(null);
    setActiveRegion(null);
    loadRegion(
      isMlbbUnified(gameCode) ? resolveMlbbRegionFromCode(gameCode) : null,
      { initial: true, useRetry: true }
    );
  }, [gameCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const regions = detail?.regions || [];
  const showRegionTabs = isMlbbUnified(gameCode) || regions.length > 1;
  const checkoutGameCode = isMlbbUnified(gameCode)
    ? detail?.g2bulkCode ?? MLBB_REGIONS.find((r) => r.id === activeRegion)?.gameCode
    : gameCode;

  const prefetchRegions = useCallback(
    (regionList, currentRegion) => {
      for (const region of regionList) {
        const key = regionKey(region.code);
        if (key === regionKey(currentRegion)) continue;
        if (regionCacheRef.current.has(key)) continue;

        fetchStoreGame(gameCode, region.code)
          .then((data) => {
            regionCacheRef.current.set(regionKey(data.active_region || region.code), data);
          })
          .catch(() => {});
      }
    },
    [gameCode]
  );

  useEffect(() => {
    if (!detail?.regions?.length || initialLoading) return;
    prefetchRegions(detail.regions, activeRegion);
  }, [detail?.regions, activeRegion, initialLoading, prefetchRegions]);

  const handleRegionChange = (regionCode) => {
    if (!regionCode || regionCode === activeRegion) return;

    const cached = regionCacheRef.current.get(regionKey(regionCode));
    setActiveRegion(regionCode);
    if (cached) {
      applyRegionData(cached, regionCode);
      return;
    }

    loadRegion(regionCode);
  };

  const related = games
    .filter((g) => g.code !== gameCode && !(isMlbbVariant(g.code) && isMlbbUnified(gameCode)))
    .slice(0, 3);

  if (initialLoading && !detail) {
    return (
      <div className="site-container animate-fade-in py-12 sm:py-16">
        <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-video rounded-3xl skeleton-shimmer" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">Loading game packages…</p>
      </div>
    );
  }

  if (!initialLoading && (error || !detail?.game)) {
    return (
      <div className="site-container py-20 text-center">
        <div
          className="glass-panel mx-auto max-w-md animate-scale-in px-6 py-12 opacity-0"
          style={{ animationFillMode: "forwards" }}
        >
          <p className="text-5xl" aria-hidden>
            🎮
          </p>
          <h1 className="mt-4 text-xl font-bold text-white">Game not found</h1>
          <p className="mt-2 text-slate-400">{error || "This game is not in the catalog."}</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  const game = detail.game;
  const packages = detail.packages || [];
  const gradient = gradientForCode(game.code);

  return (
    <div className="site-container py-8 sm:py-12">
      <Link
        to={GAMES_PATH}
        className="inline-flex items-center text-sm font-medium text-accent-light transition-all duration-300 hover:-translate-x-0.5 hover:text-white"
      >
        ← Back to games
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:grid-cols-[1.15fr_0.85fr] xl:gap-14">
        <div
          className={`cover-placeholder aspect-video animate-slide-up overflow-hidden rounded-3xl border border-surface-border opacity-0 shadow-glow ${
            game.image_url ? "bg-surface-raised" : `bg-gradient-to-br ${gradient}`
          }`}
          style={{ animationFillMode: "forwards" }}
        >
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.name || "Game cover"}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          ) : (
            <span className="text-6xl font-black text-white/15 sm:text-8xl">
              {(game.name || "").slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>

        <div
          className="animate-slide-up opacity-0 animate-delay-150"
          style={{ animationFillMode: "forwards" }}
        >
          <span className="badge-platform">Game top-up</span>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            {game.name}
          </h1>
          <p className="mt-4 text-slate-400">
            Choose a package, enter your game ID, verify your account, then confirm
            the top-up.
          </p>

          {showRegionTabs ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Region
              </p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="tablist"
                aria-label="Game region"
              >
                {regions.map((region) => {
                  const selected = region.code === activeRegion;
                  const isLoadingTab = regionLoading && selected;
                  return (
                    <button
                      key={region.code}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-busy={isLoadingTab}
                      onClick={() => handleRegionChange(region.code)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 ${
                        selected
                          ? "border-accent bg-accent/15 text-accent-light shadow-glow"
                          : "border-surface-border bg-surface-raised text-slate-300 hover:border-accent/40 hover:text-white"
                      } ${regionLoading && !selected ? "opacity-80" : ""}`}
                    >
                      <RegionIcon regionCode={region.code} size={18} />
                      <span>{region.label}</span>
                      {isLoadingTab ? (
                        <span
                          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-light/30 border-t-accent-light"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={regionLoading ? "pointer-events-none opacity-70" : ""}>
        <PlayerCheckoutSection
          gameCode={checkoutGameCode}
          gameName={game.name}
          detail={detail}
          selectedPackage={selectedPackage}
          activeRegion={activeRegion}
        />
      </div>

      <section className="relative mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white sm:text-xl">Choose a package</h2>
          {regionLoading ? (
            <span className="text-xs font-medium text-slate-500">Updating packages…</span>
          ) : null}
        </div>

        <div className={`relative mt-4 ${regionLoading ? "min-h-[12rem]" : ""}`}>
          {regionLoading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/40 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised px-4 py-2 text-sm text-slate-300">
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-light/30 border-t-accent-light"
                  aria-hidden
                />
                Loading region packages…
              </span>
            </div>
          ) : null}

          <PackageCatalog
            packages={packages}
            selectedPackage={selectedPackage}
            onSelect={setSelectedPackage}
            gameCode={checkoutGameCode ?? gameCode}
            gameName={game.name}
          />
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-surface-border pt-12">
          <h2 className="section-heading">More games</h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {related.map((g) => (
              <li key={g.code}>
                <GameCard game={g} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
