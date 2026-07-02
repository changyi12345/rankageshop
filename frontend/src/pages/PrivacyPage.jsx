import { Link } from "react-router-dom";
import { ACCOUNT_DELETE_PATH } from "../config/siteNav";
import { BRAND_DOMAIN, BRAND_FULL_NAME } from "../constants/brand";

const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    body: `${BRAND_FULL_NAME} ("we", "us") operates ${BRAND_DOMAIN} as a game top-up service for customers in Myanmar. This policy explains what personal data we collect, why we collect it, and how you can control it.`,
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    items: [
      "Account details: username, email address, phone number (optional), and profile photo (optional).",
      "Wallet & orders: top-up amounts, payment method used, payment proof screenshots, order history, and in-game player IDs you submit at checkout.",
      "Technical data: device/browser type, IP address, and basic usage needed to keep the service secure and running.",
    ],
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    items: [
      "Create and manage your account.",
      "Process wallet top-ups and deliver game credits to the player ID you provide.",
      "Review payment proofs submitted by you for approval.",
      "Send service emails such as verification, password reset, and order-related updates.",
      "Prevent fraud, abuse, and unauthorized access.",
    ],
  },
  {
    id: "payment-proof",
    title: "Payment proof & wallet data",
    body: "When you top up your wallet, you may upload a payment screenshot. Our staff reviews these images to confirm your transfer. Proof images are stored securely on our servers and are only used for payment verification and support.",
  },
  {
    id: "sharing",
    title: "Sharing your data",
    body: "We do not sell your personal information. We share data only when needed to operate the service — for example with payment partners, game delivery providers, or hosting infrastructure — and only to the extent required for those purposes.",
  },
  {
    id: "retention",
    title: "Data retention",
    body: "We keep account and transaction records while your account is active and for a reasonable period afterward to meet legal, accounting, and support requirements. When your account is deleted, we remove or anonymize personal data that we no longer need, except where retention is required by law.",
  },
  {
    id: "security",
    title: "Security",
    body: "We use industry-standard safeguards to protect your account and stored data. No online service can guarantee perfect security, so please use a strong password and keep your login details private.",
  },
  {
    id: "your-rights",
    title: "Your rights",
    items: [
      "Access or update your profile information from your account settings.",
      "Request correction of inaccurate data by contacting support.",
      "Request deletion of your account and associated personal data.",
      "Withdraw consent where processing is based on consent, subject to legal or contractual limits.",
    ],
  },
  {
    id: "account-deletion",
    title: "Account deletion",
    body: (
      <>
        You can submit an account deletion request from your profile or our{" "}
        <Link to={ACCOUNT_DELETE_PATH} className="text-accent-light hover:text-accent">
          account delete request page
        </Link>
        . After verification, we will process eligible requests and remove data that we are not required to keep.
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <>
        Questions about this policy? Email{" "}
        <a href={`mailto:support@${BRAND_DOMAIN}`} className="text-accent-light hover:text-accent">
          support@{BRAND_DOMAIN}
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
  const updated = "May 2026";

  return (
    <div className="site-container py-10 sm:py-14 lg:py-16">
      <div className="legal-layout">
        <article className="legal-page min-w-0">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">Legal</p>
          <h1 className="section-heading mt-2">Privacy policy</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>

          <div className="legal-page__body mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
              {section.body ? (
                <div className="mt-3 text-sm leading-relaxed text-slate-400">
                  {section.body}
                </div>
              ) : null}
                {section.items ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-400">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={ACCOUNT_DELETE_PATH} className="btn-secondary inline-flex">
              Request account deletion
            </Link>
          <Link to="/" className="btn-secondary inline-flex">
            Back to store
          </Link>
          </div>
        </article>

        <aside className="legal-layout__nav" aria-label="On this page">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            On this page
          </p>
          <ul className="legal-layout__nav-list mt-4">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="legal-layout__nav-link">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
