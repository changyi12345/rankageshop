import { Link } from "react-router-dom";
import {
  ACCOUNT_DELETE_PATH,
  CONTACT_SUPPORT_PATH,
  GAMES_PATH,
  ORDERS_HISTORY_PATH,
  PRIVACY_PATH,
  WALLET_ADD_LABEL,
  WALLET_HISTORY_LABEL,
  WALLET_HISTORY_PATH,
  WALLET_TOPUP_PATH,
} from "../config/siteNav";
import { BRAND_DOMAIN } from "../constants/brand";
import ContactSupportSection from "../components/support/ContactSupportSection";

const TOPICS = [
  {
    title: "Order status",
    body: "After checkout, your game top-up moves from pending to completed. View order history from your profile for purchases, or wallet history for balance loads.",
    links: [
      { label: "Order history", to: ORDERS_HISTORY_PATH },
      { label: WALLET_HISTORY_LABEL, to: WALLET_HISTORY_PATH },
      { label: "Profile", to: "/profile" },
    ],
  },
  {
    title: "Refund policy",
    body: "If delivery fails or the wrong package was sent, contact support with your order ID. Verified mistakes are refunded to your wallet where applicable.",
    links: [{ label: "Contact support", to: CONTACT_SUPPORT_PATH }],
  },
  {
    title: "Wallet & payments",
    body: "Top up your wallet using the payment methods on the wallet top-up page. Use wallet balance at checkout for faster repeat purchases.",
    links: [{ label: WALLET_ADD_LABEL, to: WALLET_TOPUP_PATH }],
  },
  {
    title: "Game ID & delivery",
    body: "Double-check your game ID before paying. Most top-ups are instant once payment clears; delays may occur during maintenance or high traffic.",
    links: [{ label: "Browse games", to: GAMES_PATH }],
  },
  {
    title: "Account & sign in",
    body: "Create a free account to save orders and use the wallet. Forgot your password? Use the reset link from the sign-in page.",
    links: [
      { label: "Sign in", to: "/login" },
      { label: "Create account", to: "/register" },
    ],
  },
  {
    title: "Privacy & data",
    body: "Read how we collect, use, and protect your personal information. You can also submit a formal request to delete your account.",
    links: [
      { label: "Privacy policy", to: PRIVACY_PATH },
      { label: "Delete account", to: ACCOUNT_DELETE_PATH },
    ],
  },
];

export default function HelpPage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="site-container">
        <div className="help-page__header">
          <div className="help-page__header-copy">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">Support</p>
            <h1 className="section-heading mt-2">Help & support</h1>
            <p className="section-sub mt-3">
              Answers for orders, wallet, and game top-ups on {BRAND_DOMAIN}.
            </p>
          </div>
          <div className="glass-panel shrink-0 p-5 sm:p-6 lg:min-w-[18rem]">
            <p className="text-sm font-semibold text-white">Need direct help?</p>
            <p className="mt-2 text-sm text-slate-400">
              Use live chat or email us with your order ID and game ID for faster support.
            </p>
            <Link to={CONTACT_SUPPORT_PATH} className="btn-primary mt-4 inline-flex w-full justify-center sm:w-auto">
              Contact support
            </Link>
          </div>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {TOPICS.map((topic) => (
            <li key={topic.title} className="glass-panel p-6">
              <h2 className="text-lg font-bold text-white">{topic.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{topic.body}</p>
              {topic.links.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {topic.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm font-medium text-accent-light hover:text-accent">
                        {link.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>

        <ContactSupportSection className="glass-panel mt-10 border-accent/25 p-6 sm:p-8" />
      </div>
    </section>
  );
}
