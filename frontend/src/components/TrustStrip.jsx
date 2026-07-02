import { useRef } from "react";
import { useSectionReveal } from "../hooks/useSectionReveal";

const ITEMS = [
  {
    title: "Instant game delivery",
    body: "Diamonds, UC, and credits are sent to your game ID after wallet payment clears.",
    icon: "⚡",
  },
  {
    title: "Secure checkout",
    body: "Sign in securely, verify your player ID, and pay from your RanKageShop wallet.",
    icon: "🔒",
  },
  {
    title: "Live catalog",
    body: "Games and packages update automatically so MMK prices stay current.",
    icon: "✓",
  },
  {
    title: "Local wallets",
    body: "Load your balance with familiar transfer methods, then checkout in one tap.",
    icon: "💳",
  },
];

const COPY = {
  home: {
    eyebrow: "Why RanKageShop",
    title: "Built for game top-ups",
    sub: "Fair MMK prices, verified player IDs, and fast delivery to your favorite titles.",
  },
  default: {
    eyebrow: "Simple process",
    title: "How it works",
    sub: "Pick your game, choose a package, pay from your wallet — credits land on your game ID.",
  },
};

export default function TrustStrip({ variant = "default" }) {
  const ref = useRef(null);
  const visible = useSectionReveal(ref);
  const copy = COPY[variant] || COPY.default;

  return (
    <section
      ref={ref}
      className={`section-reveal border-y border-surface-border bg-surface-raised/50 py-12 sm:py-16 ${visible ? "section-reveal--visible" : ""}`}
    >
      <div className="site-container">
        <div className="mb-10 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">
            {copy.eyebrow}
          </p>
          <h2 className="section-heading mt-2">{copy.title}</h2>
          <p className="section-sub mx-auto mt-2 max-w-2xl lg:mx-0">{copy.sub}</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <li
              key={item.title}
              className="trust-strip-card flex gap-4 rounded-2xl border border-surface-border bg-surface-card p-5 transition-all duration-500 ease-softer hover:-translate-y-1 hover:border-accent/35 hover:shadow-glow"
              style={{ transitionDelay: visible ? `${120 + i * 70}ms` : "0ms" }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-xl"
                aria-hidden
              >
                {item.icon}
              </span>
              <div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
