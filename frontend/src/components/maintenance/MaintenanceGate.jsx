import { Link, useLocation } from "react-router-dom";
import { useMaintenanceMode } from "../../context/ShopSettingsContext";

const ALLOWED_PATHS = [
  "/help",
  "/about",
  "/privacy",
  "/how-it-works",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/activate-account",
];

function isAllowedDuringMaintenance(pathname) {
  return ALLOWED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default function MaintenanceGate({ children }) {
  const { pathname } = useLocation();
  const { maintenanceMode, maintenanceMessage, shopName, loading } = useMaintenanceMode();

  if (loading || !maintenanceMode || isAllowedDuringMaintenance(pathname)) {
    return children;
  }

  return (
    <div className="maintenance-gate">
      <div className="maintenance-gate__backdrop" aria-hidden />
      <div className="maintenance-gate__content">{children}</div>

      <div
        className="maintenance-gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-gate-title"
      >
        <div className="maintenance-gate__card">
          <span className="maintenance-gate__badge">Maintenance mode</span>
          <div className="maintenance-gate__icon" aria-hidden>
            🔧
          </div>
          <h2 id="maintenance-gate-title" className="maintenance-gate__title">
            {shopName} is temporarily unavailable
          </h2>
          <p className="maintenance-gate__message">{maintenanceMessage}</p>
          <p className="maintenance-gate__hint">
            New orders, top-ups, and checkouts are paused. You can still read Help or contact
            support.
          </p>
          <div className="maintenance-gate__actions">
            <Link to="/help#contact-support" className="btn-primary px-5 py-2.5 text-sm">
              Contact support
            </Link>
            <Link to="/help" className="btn-secondary px-5 py-2.5 text-sm">
              Help center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
