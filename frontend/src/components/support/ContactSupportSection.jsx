import { Link } from "react-router-dom";
import { ORDERS_HISTORY_PATH, WALLET_HISTORY_PATH } from "../../config/siteNav";
import { BRAND_FULL_NAME } from "../../constants/brand";
import { useShopContact, openLiveChat } from "../../hooks/useShopContact";
import { toast } from "../../utils/toast";

const CHECKLIST = [
  "Your order ID (Profile → Order history)",
  "Game ID / player ID and server (for top-ups)",
  "Payment screenshot or transaction ref (for wallet top-ups)",
  "Your account username",
];

function ContactCard({ icon, title, children, primary = false }) {
  return (
    <div
      className={`contact-card ${primary ? "contact-card--primary" : ""}`}
    >
      <span className="contact-card__icon" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="contact-card__title">{title}</h3>
        <div className="contact-card__body">{children}</div>
      </div>
    </div>
  );
}

export default function ContactSupportSection({ className = "" }) {
  const { contact, loading } = useShopContact();
  const liveChatReady = Boolean(contact?.liveChatEnabled);

  const onLiveChat = () => {
    if (!liveChatReady) {
      toast.info("Live chat is currently disabled. Please email or message us below.");
      return;
    }
    openLiveChat();
  };

  return (
    <section
      id="contact-support"
      className={`contact-support ${className}`.trim()}
      aria-labelledby="contact-support-heading"
    >
      <div className="contact-support__intro">
        <h2 id="contact-support-heading" className="text-xl font-bold text-white sm:text-2xl">
          Contact support
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Need help with an order, wallet top-up, or voucher code? Our team is here for you.
          Live chat is the fastest option — include your order details so we can help right away.
        </p>
      </div>

      <div className="contact-support__grid mt-8">
        <ContactCard
          primary
          icon="💬"
          title="Live chat"
        >
          <p className="text-sm text-slate-400">
            {liveChatReady
              ? "Chat with us in real time for order and payment questions."
              : "Live chat is turned off — use email or Telegram below."}
          </p>
          <button
            type="button"
            id="live-chat-launcher"
            className="btn-primary mt-4 w-full sm:w-auto"
            onClick={onLiveChat}
            disabled={loading}
          >
            {liveChatReady ? "Start live chat" : "Live chat unavailable"}
          </button>
          {!liveChatReady ? (
            <p className="mt-2 text-xs text-slate-500">
              Enable live chat in Admin → Settings → Features.
            </p>
          ) : null}
        </ContactCard>

        <ContactCard icon="✉️" title="Email">
          <p className="text-sm text-slate-400">
            Send your order ID and a short description. We reply during business hours.
          </p>
          <a
            href={`mailto:${contact?.email ?? ""}?subject=${encodeURIComponent(`${BRAND_FULL_NAME} support`)}`}
            className="mt-3 inline-flex text-sm font-semibold text-accent-light hover:text-accent"
          >
            {contact?.email}
          </a>
        </ContactCard>

        {contact?.phone ? (
          <ContactCard icon="📞" title="Phone / Viber">
            <p className="text-sm text-slate-400">Call or message us on Viber.</p>
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="mt-3 inline-flex text-sm font-semibold text-accent-light hover:text-accent"
            >
              {contact.phone}
            </a>
          </ContactCard>
        ) : null}

        {contact?.telegram ? (
          <ContactCard icon="✈️" title="Telegram">
            <p className="text-sm text-slate-400">Message us on Telegram for quick updates.</p>
            <a
              href={contact.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-accent-light hover:text-accent"
            >
              Open Telegram →
            </a>
          </ContactCard>
        ) : null}
      </div>

      <div className="contact-support__aside mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Before you contact us
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent-light" aria-hidden>
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={ORDERS_HISTORY_PATH} className="text-sm font-medium text-accent-light hover:underline">
              Order history
            </Link>
            <Link to={WALLET_HISTORY_PATH} className="text-sm font-medium text-accent-light hover:underline">
              Wallet history
            </Link>
          </div>
        </div>

        <div className="glass-panel p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Response times
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-white">Live chat & Telegram</dt>
              <dd className="mt-0.5 text-slate-400">Usually within minutes during support hours.</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Email</dt>
              <dd className="mt-0.5 text-slate-400">Within 24 hours on business days.</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Support hours</dt>
              <dd className="mt-0.5 text-slate-400">Daily 9:00 AM – 9:00 PM (Myanmar Time).</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Refunds for failed deliveries are reviewed case by case and credited to your wallet when approved.
          </p>
        </div>
      </div>

      <div id="live-chat-widget" className="live-chat-widget-mount" aria-hidden />
    </section>
  );
}
