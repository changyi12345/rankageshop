import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import { gradientForCode } from "../utils/gradients";

function CoverArt({ game }) {
  const gradient = gradientForCode(game.code);

  if (game.image_url) {
    return (
      <div className="cover-placeholder overflow-hidden bg-surface-raised">
        <img
          src={game.image_url}
          alt={game.name || "Game cover"}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`cover-placeholder bg-gradient-to-br ${gradient}`}>
      <span className="relative z-10 text-3xl font-black tracking-tighter text-white/25 sm:text-4xl">
        {(game.name || game.code || "?").slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}

export default function GameCard({ game }) {
  const code = game.code;
  const label =
    game.min_price != null
      ? `From ${formatPrice(game.min_price, game.currency)}`
      : "View packages";

  return (
    <article className="game-card group">
      <Link to={`/games/${code}`} className="relative block overflow-hidden">
        <CoverArt game={game} />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-surface/90 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
      <div className="relative z-[2] flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/games/${code}`}
              className="text-sm font-semibold text-white transition hover:text-accent-light line-clamp-2 sm:text-base"
            >
              {game.name}
            </Link>
            <span className="badge-platform mt-1.5 hidden sm:inline-flex sm:mt-2">Game top-up</span>
          </div>
        </div>
        <p className="mt-3 hidden text-sm text-slate-400 line-clamp-2 sm:block">
          Instant delivery — select a package on the game page.
        </p>
        <Link
          to={`/games/${code}`}
          className="btn-primary mt-2 w-full py-2 text-center text-xs group/btn sm:mt-4 sm:py-2.5 sm:text-sm"
        >
          <span className="inline-block transition-transform duration-300 group-hover/btn:translate-x-0.5">
            {label}
          </span>
        </Link>
      </div>
    </article>
  );
}
