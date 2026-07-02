import { Link } from "react-router-dom";
import { useMaintenanceMode } from "../../context/ShopSettingsContext";

export default function MaintenanceBanner() {
  const { maintenanceMode, maintenanceMessage, shopName, loading } = useMaintenanceMode();

  if (loading || !maintenanceMode) return null;

  return (
    <div className="maintenance-banner" role="alert" aria-live="assertive">
      <div className="maintenance-banner__inner site-container">
        <span className="maintenance-banner__icon" aria-hidden>
          🔧
        </span>
        <div className="maintenance-banner__copy">
          <p className="maintenance-banner__title">
            {shopName} — Maintenance in progress
          </p>
          <p className="maintenance-banner__message">{maintenanceMessage}</p>
        </div>
        <Link to="/help#contact-support" className="maintenance-banner__cta">
          Contact support
        </Link>
      </div>
    </div>
  );
}
