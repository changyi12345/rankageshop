import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DealsBanner from "../components/DealsBanner";
import ShopEventsSection from "../components/ShopEventsSection";
import { fetchHomeContent } from "../api/content";
import { GAMES_PATH, HOW_IT_WORKS_PATH, WALLET_ADD_LABEL, WALLET_TOPUP_PATH } from "../config/siteNav";

const HIGHLIGHTS = [
  {
    title: "Wallet checkout",
    body: "Load your balance once and pay for game packages in seconds.",
    cta: WALLET_ADD_LABEL,
    to: WALLET_TOPUP_PATH,
  },
  {
    title: "Live game catalog",
    body: "Packages and MMK prices refresh automatically from our supplier.",
    cta: "Browse games",
    to: GAMES_PATH,
  },
  {
    title: "Fast delivery",
    body: "Credits are sent to your game ID after wallet payment is confirmed.",
    cta: "How it works",
    to: HOW_IT_WORKS_PATH,
  },
];

export default function PromotionsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchHomeContent()
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data?.events) ? data.events : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <DealsBanner />
      <ShopEventsSection events={events} title="Shop events & news" />
      <section className="py-14 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="mb-10">
            <h2 className="section-heading">Why shop with RanKageShop</h2>
            <p className="section-sub mt-2">
              Everything you need for smooth game top-ups in Myanmar — wallet, catalog, and support.
            </p>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className="glass-panel flex flex-col p-6 transition duration-300 hover:border-accent/35 hover:shadow-glow"
              >
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
                <Link to={item.to} className="btn-secondary mt-6 inline-flex w-fit">
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
