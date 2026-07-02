import BrandLogo from "../BrandLogo";
import { BRAND_FULL_NAME, BRAND_TAGLINE } from "../../constants/brand";
import AuthPerks from "./AuthPerks";

export default function AuthLayout({ title, subtitle, badge, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--a" aria-hidden />
      <div className="auth-page__glow auth-page__glow--b" aria-hidden />

      <p className="auth-page__mobile-tag lg:hidden">
        Fast top-up · Wallet pay · Track every order
      </p>

      <div className="auth-page__grid">
        <aside className="auth-panel" aria-label="Platform highlights">
          <div className="auth-panel__inner">
            <div className="auth-panel__brand opacity-0 animate-slide-up" style={{ animationFillMode: "forwards" }}>
              <BrandLogo size="lg" showWordmark showTagline asLink={false} prominent />
            </div>

            <div
              className="auth-panel__hero opacity-0 animate-slide-up"
              style={{ animationDelay: "60ms", animationFillMode: "forwards" }}
            >
              <p className="auth-panel__eyebrow">{BRAND_TAGLINE}</p>
              <h2 className="auth-panel__headline">
                Fast top-up.
                <span className="text-gradient"> Simple checkout.</span>
              </h2>
              <p className="auth-panel__lead">
                {BRAND_FULL_NAME} — instant credits, wallet balance, and order tracking for customers in
                Myanmar.
              </p>
            </div>

            <AuthPerks />

            <div
              className="auth-panel__stats opacity-0 animate-slide-up"
              style={{ animationDelay: "420ms", animationFillMode: "forwards" }}
            >
              <div className="auth-stat">
                <span className="auth-stat__value">24/7</span>
                <span className="auth-stat__label">Orders</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat__value">Wallet</span>
                <span className="auth-stat__label">Pay balance</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat__value">Secure</span>
                <span className="auth-stat__label">Checkout</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="auth-page__form-col">
          <div className="auth-form-card animate-scale-in opacity-0" style={{ animationFillMode: "forwards" }}>
            {badge ? <span className="auth-form-card__badge">{badge}</span> : null}
            <h1 className="auth-form-card__title">{title}</h1>
            {subtitle ? <p className="auth-form-card__subtitle">{subtitle}</p> : null}
            <div className="auth-form-card__body">{children}</div>
            {footer ? <div className="auth-form-card__footer">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
