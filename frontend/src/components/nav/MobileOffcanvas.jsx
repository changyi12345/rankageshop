import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND_FULL_NAME } from "../../constants/brand";
import {
  DRAWER_AUTH_USER,
  DRAWER_NAV,
} from "../../config/siteNav";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../hooks/useWallet";
import { formatPrice } from "../../utils/format";
import BrandLogo from "../BrandLogo";
import { NavIcon } from "./NavIcons";

function DrawerLink({ item, onClose }) {
  if (item.action === "logout") {
    return null;
  }

  return (
    <Link to={item.href} className="offcanvas-nav__item" onClick={onClose}>
      <span className="offcanvas-nav__icon">
        <NavIcon name={item.icon} />
      </span>
      <span className="offcanvas-nav__label">{item.label}</span>
      <NavIcon name="chevron" className="offcanvas-nav__chevron h-4 w-4 opacity-50" />
    </Link>
  );
}

export default function MobileOffcanvas({ open, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { balance } = useWallet();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close drawer on route change only
  }, [pathname]);

  const handleLogout = () => {
    onClose();
    if (!logout()) return;
    navigate("/");
  };

  const navItems = DRAWER_NAV.filter((item) => {
    if (item.guestOnly && user) return false;
    if (item.requiresAuth && !user) return false;
    return true;
  });
  const authItems = user ? DRAWER_AUTH_USER : [];

  return (
    <>
      <div
        className={`offcanvas-backdrop ${open ? "offcanvas-backdrop--open" : ""}`}
        aria-hidden={!open}
        onClick={onClose}
      />

      <aside
        className={`offcanvas-panel ${open ? "offcanvas-panel--open" : ""}`}
        aria-hidden={!open}
        aria-label="Menu"
        role="dialog"
      >
        <div className="offcanvas-panel__header">
          <button
            type="button"
            className="offcanvas-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <NavIcon name="close" className="h-6 w-6" />
          </button>
        </div>

        <div className="offcanvas-panel__brand">
          <BrandLogo size="xl" prominent asLink={false} className="mx-auto justify-center" />
          <p className="offcanvas-panel__brand-name">{BRAND_FULL_NAME}</p>
          {user ? (
            <p className="offcanvas-panel__balance">
              {formatPrice(balance, "MMK")}
            </p>
          ) : null}
        </div>

        <nav className="offcanvas-nav" aria-label="Main menu">
          {navItems.map((item) => (
            <DrawerLink key={item.id} item={item} onClose={onClose} />
          ))}

          {authItems.length > 0 ? <div className="offcanvas-nav__divider" /> : null}

          {!authLoading &&
            authItems.map((item) =>
              item.action === "logout" ? (
                <button
                  key={item.id}
                  type="button"
                  className="offcanvas-nav__item offcanvas-nav__item--danger w-full"
                  onClick={handleLogout}
                >
                  <span className="offcanvas-nav__icon">
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="offcanvas-nav__label">{item.label}</span>
                  <NavIcon name="chevron" className="offcanvas-nav__chevron h-4 w-4 opacity-50" />
                </button>
              ) : (
                <DrawerLink key={item.id} item={item} onClose={onClose} />
              )
            )}
        </nav>
      </aside>
    </>
  );
}
