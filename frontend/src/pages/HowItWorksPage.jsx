import { Link } from "react-router-dom";
import { GAMES_PATH, WALLET_ADD_LABEL_FIRST, WALLET_TOPUP_PATH } from "../config/siteNav";

const STEPS = [
  {
    step: "1",
    title: "Choose your game",
    body: "Open the games catalog, pick a title, and select a diamond or UC package.",
  },
  {
    step: "2",
    title: "Enter game ID",
    body: "Type your in-game ID. On supported titles we verify the account before you pay.",
  },
  {
    step: "3",
    title: "Pay from wallet",
    body: "Top up your wallet with a local transfer, then pay for packages at checkout.",
  },
  {
    step: "4",
    title: "Get fast delivery",
    body: "Credits are sent to your game ID after payment is confirmed.",
  },
];

export default function HowItWorksPage() {
  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="site-container">
        <div className="mb-10 text-center lg:mb-12">
          <h2 className="section-heading">Step by step</h2>
          <p className="section-sub mx-auto mt-2 max-w-2xl">
            From browsing to delivery — everything happens in a few taps.
          </p>
        </div>
        <ol className="how-steps">
          {STEPS.map((item) => (
            <li key={item.step} className="how-step-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display text-lg font-bold text-accent-light">
                {item.step}
              </span>
              <div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link to={GAMES_PATH} className="btn-primary">
            Browse games
          </Link>
          <Link to={WALLET_TOPUP_PATH} className="btn-secondary">
            {WALLET_ADD_LABEL_FIRST}
          </Link>
        </div>
      </div>
    </section>
  );
}
