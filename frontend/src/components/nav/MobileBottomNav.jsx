import { Link, useLocation } from "react-router-dom";
import { BOTTOM_NAV } from "../../config/siteNav";
import { useAuth } from "../../context/AuthContext";
import { NavIcon } from "./NavIcons";

function resolveHref(item, user) {
  if (item.requiresAuth && user && item.authHref) return item.authHref;
  if (item.requiresAuth && !user && item.guestHref) return item.guestHref;
  return item.href;
}

function isTabActive(item, pathname, user) {
  if (item.center) {
    return pathname === "/wallet/top-up";
  }
  if (item.match) return item.match(pathname, user);
  if (item.href === "/") return pathname === "/";
  if (item.href.startsWith("/wallet")) return pathname.startsWith("/wallet");
  return pathname === item.href;
}

function BottomTab({ item, active, user }) {
  const href = resolveHref(item, user);

  if (item.center) {
    return (
      <Link
        to={href}
        className={`bottom-nav__fab ${active ? "bottom-nav__fab--active" : ""}`}
        aria-label={item.label}
      >
        <span className="bottom-nav__fab-inner">
          <NavIcon name={item.icon} className="h-7 w-7 text-surface" />
        </span>
        <span className="bottom-nav__fab-label">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={`bottom-nav__tab ${active ? "bottom-nav__tab--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {active ? <span className="bottom-nav__indicator" aria-hidden /> : null}
      <NavIcon name={item.icon} className="bottom-nav__icon" />
      <span className="bottom-nav__label">{item.label}</span>
    </Link>
  );
}

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="bottom-nav lg:hidden" aria-label="Bottom navigation">
      <div className="bottom-nav__inner">
        {BOTTOM_NAV.map((item) => (
          <BottomTab
            key={item.id}
            item={item}
            active={isTabActive(item, pathname, user)}
            user={user}
          />
        ))}
      </div>
    </nav>
  );
}
