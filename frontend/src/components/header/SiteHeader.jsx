import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AUTH_SIGN_IN_LABEL,
  AUTH_SIGN_UP_LABEL,
  GAMES_PATH,
  VOUCHERS_PATH,
  HOME_PATH,
  MAIN_NAV,
  WALLET_ADD_LABEL,
  WALLET_TOPUP_PATH,
} from "../../config/siteNav";
import AnnouncementMarquee from "../AnnouncementMarquee";
import MobileOffcanvas from "../nav/MobileOffcanvas";
import { NavIcon } from "../nav/NavIcons";
import { useAuth } from "../../context/AuthContext";
import { useHeaderScroll } from "../../hooks/useHeaderScroll";
import BrandLogo from "../BrandLogo";
import HeaderAccountMenu from "./HeaderAccountMenu";
import HeaderWalletBalance from "./HeaderWalletBalance";
import NotificationBell from "../notifications/NotificationBell";

function isNavActive(pathname, href) {
  if (href === HOME_PATH) {
    return pathname === HOME_PATH;
  }
  if (href === WALLET_TOPUP_PATH) {
    return pathname.startsWith("/wallet");
  }
  if (href === GAMES_PATH) {
    return pathname === GAMES_PATH || pathname.startsWith("/games/");
  }
  if (href === VOUCHERS_PATH) {
    return pathname === VOUCHERS_PATH || pathname.startsWith("/vouchers/");
  }
  return pathname === href;
}

export default function SiteHeader() {
  const { pathname } = useLocation();
  const { user, loading: authLoading } = useAuth();
  const scrolled = useHeaderScroll();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  useEffect(() => {
    const locked = drawerOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const renderNavLink = (item, className = "") => {
    const active = isNavActive(pathname, item.href);
    const cls = [
      "header-nav-link",
      active && "header-nav-link--active",
      item.primary && "header-nav-link--featured",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Link key={item.id} to={item.href} className={cls} onClick={closeDrawer}>
        {item.icon ? <NavIcon name={item.icon} className="h-4 w-4 shrink-0" /> : null}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <AnnouncementMarquee />

        <div className="site-container site-header__row">
          <button
            type="button"
            className="header-icon-btn lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <NavIcon name="menu" className="h-6 w-6" />
          </button>

          <BrandLogo size="header" prominent className="mx-auto shrink-0 lg:mx-0" />

          <nav className="header-nav" aria-label="Main">
            {MAIN_NAV.map((item) => renderNavLink(item))}
          </nav>

          <div className="header-actions ml-auto flex items-center gap-1 sm:gap-2">
            {!authLoading && user ? <NotificationBell className="shrink-0" /> : null}

            <div className="hidden lg:contents">
              {!authLoading && user ? (
                <HeaderAccountMenu onNavigate={closeDrawer} />
              ) : !authLoading ? (
                <>
                  <Link to="/login" className="header-nav-link">
                    {AUTH_SIGN_IN_LABEL}
                  </Link>
                  <Link to="/register" className="header-cta-pill">
                    <span>{AUTH_SIGN_UP_LABEL}</span>
                  </Link>
                </>
              ) : null}

              <Link
                to={WALLET_TOPUP_PATH}
                className={user ? "header-cta-pill" : "header-nav-link header-nav-link--featured"}
              >
                {user ? <span>{WALLET_ADD_LABEL}</span> : "Top Up"}
              </Link>
            </div>

            <HeaderWalletBalance className="lg:hidden shrink-0" />

            {!authLoading && !user ? (
              <div className="flex items-center gap-1.5 lg:hidden">
                <Link to="/login" className="header-nav-link px-2.5 py-1.5 text-xs sm:text-sm">
                  {AUTH_SIGN_IN_LABEL}
                </Link>
                <Link to="/register" className="header-cta-pill !px-3 !py-1.5 text-xs sm:text-sm">
                  <span>{AUTH_SIGN_UP_LABEL}</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <MobileOffcanvas open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}
