import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { GAMES_PATH, HELP_PATH } from "../config/siteNav";

export default function NotFoundPage() {
  return (
    <div className="site-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <BrandLogo size="hero" prominent asLink={false} className="mb-8 justify-center" />
      <p className="font-display text-8xl font-black text-gradient sm:text-9xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Return to store
        </Link>
        <Link to={GAMES_PATH} className="btn-secondary">
          Browse games
        </Link>
        <Link to={HELP_PATH} className="btn-secondary">
          Help
        </Link>
      </div>
    </div>
  );
}
