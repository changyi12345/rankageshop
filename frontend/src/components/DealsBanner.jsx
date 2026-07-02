import { useRef } from "react";
import { Link } from "react-router-dom";
import { WALLET_ADD_LABEL, WALLET_TOPUP_PATH } from "../config/siteNav";
import { useSectionReveal } from "../hooks/useSectionReveal";

export default function DealsBanner() {
  const ref = useRef(null);
  const visible = useSectionReveal(ref);

  return (
    <section
      ref={ref}
      className={`section-reveal py-14 sm:py-16 ${visible ? "section-reveal--visible" : ""}`}
    >
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/20 via-surface-card to-accent-light/10 p-8 transition-shadow duration-500 hover:shadow-glow sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-glow-pulse rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 animate-float rounded-full bg-accent-light/10 blur-2xl"
            aria-hidden
          />
          <div className="relative max-w-xl">
            <p className="animate-fade-in text-sm font-semibold uppercase tracking-widest text-accent-light">
              Best value top-up
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              Live packages, instant delivery
            </h2>
            <p className="mt-3 text-slate-300">
              Fresh prices and stock every day. Browse mobile game credits in one place.
            </p>
            <Link to={WALLET_TOPUP_PATH} className="btn-primary mt-6 inline-flex">
              {WALLET_ADD_LABEL}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
