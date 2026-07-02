import { Link } from "react-router-dom";
import {
  GAMES_PATH,
  VOUCHERS_PATH,
  HELP_PATH,
  HOW_IT_WORKS_PATH,
  PROMOTIONS_PATH,
  WALLET_ADD_LABEL,
  WALLET_TOPUP_PATH,
} from "../config/siteNav";

const LINKS = [
  {
    to: GAMES_PATH,
    title: "Browse games",
    desc: "PUBG, MLBB, Free Fire & more",
    icon: "🎮",
  },
  {
    to: VOUCHERS_PATH,
    title: "Voucher",
    desc: "Gift cards & digital voucher codes",
    icon: "🎟️",
  },
  {
    to: PROMOTIONS_PATH,
    title: "Promotions",
    desc: "Why shop with RanKageShop",
    icon: "✨",
  },
  {
    to: HOW_IT_WORKS_PATH,
    title: "How it works",
    desc: "Top up in four simple steps",
    icon: "📋",
  },
  {
    to: HELP_PATH,
    title: "Help & support",
    desc: "Wallet, orders, and contact",
    icon: "💬",
  },
];

export default function HomeQuickLinks() {
  return (
    <section className="border-b border-surface-border py-12 sm:py-16">
      <div className="site-container">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="section-heading">Explore the store</h2>
          <p className="section-sub mt-2">
            Top up faster — browse games, load your wallet, or get help in one tap.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((item, i) => (
            <li
              key={item.to}
              className="home-stagger home-stagger--card"
              style={{ transitionDelay: `${100 + i * 75}ms` }}
            >
              <Link
                to={item.to}
                className="group glass-panel flex h-full flex-col p-5 transition-all duration-500 ease-softer hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
              >
                <span className="text-2xl" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="mt-3 font-semibold text-white group-hover:text-accent-light">{item.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-400">{item.desc}</p>
                <span className="mt-4 text-sm font-medium text-accent-light">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link to={WALLET_TOPUP_PATH} className="btn-primary">
            {WALLET_ADD_LABEL}
          </Link>
          <Link to={GAMES_PATH} className="btn-secondary">
            View all games
          </Link>
          <Link to={VOUCHERS_PATH} className="btn-secondary">
            Voucher shop
          </Link>
        </div>
      </div>
    </section>
  );
}
