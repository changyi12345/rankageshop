import { Link } from "react-router-dom";
import { BRAND_DOMAIN, BRAND_FULL_NAME } from "../constants/brand";
import {
  ACCOUNT_DELETE_PATH,
  GAMES_PATH,
  VOUCHERS_PATH,
  HELP_PATH,
  CONTACT_SUPPORT_PATH,
  HOW_IT_WORKS_PATH,
  PRIVACY_PATH,
  PROMOTIONS_PATH,
  WALLET_ADD_LABEL,
  WALLET_TOPUP_PATH,
} from "../config/siteNav";
import BrandLogo from "./BrandLogo";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-border bg-surface-raised">
      <div className="site-container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo size="lg" prominent />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {BRAND_DOMAIN} — trusted game top-up and digital vouchers for Myanmar.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Shop
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  to={GAMES_PATH}
                  className="inline-block transition-colors duration-300 hover:translate-x-0.5 hover:text-accent-light"
                >
                  All games
                </Link>
              </li>
              <li>
                <Link
                  to={WALLET_TOPUP_PATH}
                  className="inline-block transition-colors duration-300 hover:translate-x-0.5 hover:text-accent-light"
                >
                  {WALLET_ADD_LABEL}
                </Link>
              </li>
              <li>
                <Link
                  to={VOUCHERS_PATH}
                  className="inline-block transition-colors duration-300 hover:translate-x-0.5 hover:text-accent-light"
                >
                  Vouchers
                </Link>
              </li>
              <li>
                <Link
                  to={PROMOTIONS_PATH}
                  className="inline-block transition-colors duration-300 hover:translate-x-0.5 hover:text-accent-light"
                >
                  Promotions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Popular
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/games/pubgm" className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-accent-light">
                  PUBG Mobile
                </Link>
              </li>
              <li>
                <Link to="/games/mlbb_unified" className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-accent-light">
                  Mobile Legends
                </Link>
              </li>
              <li>
                <Link to="/games/freefire" className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-accent-light">
                  Free Fire
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Help & support
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link to={HELP_PATH} className="inline-block transition-colors duration-300 hover:text-accent-light">
                  Help center
                </Link>
              </li>
              <li>
                <Link to={HOW_IT_WORKS_PATH} className="inline-block transition-colors duration-300 hover:text-accent-light">
                  How it works
                </Link>
              </li>
              <li>
                <Link to={CONTACT_SUPPORT_PATH} className="inline-block transition-colors duration-300 hover:text-accent-light">
                  Contact support
                </Link>
              </li>
              <li>
                <Link to={PRIVACY_PATH} className="inline-block transition-colors duration-300 hover:text-accent-light">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to={ACCOUNT_DELETE_PATH} className="inline-block transition-colors duration-300 hover:text-accent-light">
                  Delete account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom mt-12 border-t border-surface-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-slate-500">
              © {year} {BRAND_FULL_NAME}. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              Secure top-up & voucher delivery — instant to your account.
            </p>
          </div>

          <div className="site-footer__credit mt-6 flex justify-center sm:justify-end">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__credit-link group"
              aria-label="Coded by Daniel & RanKageShop — opens in new tab"
            >
              <span className="site-footer__credit-label">Coded by</span>
              <span className="site-footer__credit-brand">Daniel & RanKageShop</span>
              <svg
                className="site-footer__credit-arrow"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
