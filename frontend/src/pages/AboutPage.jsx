import { Link } from "react-router-dom";
import {
  BRAND_DOMAIN,
  BRAND_FULL_NAME,
  BRAND_TAGLINE,
} from "../constants/brand";
import BrandLogo from "../components/BrandLogo";
import { GAMES_PATH, HOW_IT_WORKS_PATH, WALLET_TOPUP_PATH } from "../config/siteNav";

const HIGHLIGHTS = [
  {
    title: "Instant delivery",
    body: "Credits reach your game ID after payment is confirmed.",
  },
  {
    title: "Local payments",
    body: "Top up your wallet with familiar transfer methods in MMK.",
  },
  {
    title: "Trusted catalog",
    body: "Browse live packages with prices updated automatically.",
  },
];

export default function AboutPage() {
  return (
    <div className="site-container py-10 sm:py-14 lg:py-16">
      <div className="about-page">
        <div className="min-w-0 text-center lg:text-left">
          <BrandLogo size="lg" prominent className="mx-auto justify-center lg:mx-0 lg:justify-start" />
          <h1 className="section-heading mt-6">About us</h1>
          <p className="section-sub mx-auto mt-3 lg:mx-0">
            {BRAND_FULL_NAME} — {BRAND_TAGLINE}. Instant game top-ups for customers in Myanmar with
            local payment methods and MMK pricing.
          </p>
          <p className="mt-6 text-sm text-slate-400">{BRAND_DOMAIN}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link to={GAMES_PATH} className="btn-primary inline-flex">
              Browse games
            </Link>
            <Link to="/" className="btn-secondary inline-flex">
              Back to store
            </Link>
          </div>
        </div>

        <aside className="about-page__aside">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-light">
            Why RanKageShop
          </p>
          <ul className="mt-5 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title}>
                <h2 className="font-semibold text-white">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 border-t border-surface-border pt-6 sm:flex-row">
            <Link to={WALLET_TOPUP_PATH} className="btn-secondary flex-1 text-center">
              Top up wallet
            </Link>
            <Link to={HOW_IT_WORKS_PATH} className="btn-secondary flex-1 text-center">
              How it works
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
