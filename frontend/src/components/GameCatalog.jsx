import { useEffect, useMemo, useState } from "react";
import { useStoreGamesContext } from "../context/StoreGamesContext";
import GameCard from "./GameCard";
import Select from "./ui/Select";

const SORT_OPTIONS = [
  { value: "name", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "code", label: "Game code" },
];

export default function GameCatalog() {
  const { games, loading, error, reload } = useStoreGamesContext();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    const stored = sessionStorage.getItem("catalog_search");
    if (stored) {
      setQuery(stored);
      sessionStorage.removeItem("catalog_search");
    }
    const onCatalogSearch = (e) => {
      if (typeof e.detail === "string") setQuery(e.detail);
    };
    window.addEventListener("catalog-search", onCatalogSearch);
    return () => window.removeEventListener("catalog-search", onCatalogSearch);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = games.filter((game) => {
      if (!q) return true;
      return (
        (game.name || "").toLowerCase().includes(q) ||
        (game.code || "").toLowerCase().includes(q)
      );
    });

    switch (sort) {
      case "name-desc":
        list = [...list].sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "code":
        list = [...list].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
        break;
      default:
        list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [games, query, sort]);

  return (
    <section className="py-16 sm:py-20">
      <div className="site-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
          <div>
            <h2 className="section-heading">Game top-up catalog</h2>
            <p className="section-sub">
              {loading
                ? "Loading games…"
                : `${filtered.length} game${filtered.length === 1 ? "" : "s"} available`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <input
              type="search"
              className="input-field flex-1"
              placeholder="Search games…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search games"
              disabled={loading}
            />
            <Select
              value={sort}
              onValueChange={setSort}
              options={SORT_OPTIONS}
              placeholder="Sort by"
              disabled={loading}
              size="compact"
              aria-label="Sort games"
            />
          </div>
        </div>

        {!loading && error ? (
          <div className="glass-panel mt-10 border-white/20 px-6 py-10 text-center">
            <p className="text-lg font-medium text-white">Could not load games</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <button type="button" className="btn-primary mt-6" onClick={reload}>
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="game-card overflow-hidden"
                aria-hidden
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="aspect-[4/3] skeleton-shimmer" />
                <div className="space-y-3 p-4">
                  <div className="h-4 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-2/3 rounded-lg skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="glass-panel mt-10 px-6 py-14 text-center">
            <p className="text-lg font-medium text-white">No games match your search</p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          </div>
        ) : null}

        {!loading && !error && filtered.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((game, i) => (
              <li
                key={game.code}
                className="animate-fade-in opacity-0"
                style={{
                  animationDelay: `${Math.min(i * 50, 300)}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
