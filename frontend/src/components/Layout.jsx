import { Outlet } from "react-router-dom";
import { StoreGamesProvider } from "../context/StoreGamesContext";
import { ShopSettingsProvider } from "../context/ShopSettingsContext";
import ScrollToTop from "./ScrollToTop";
import SiteHeader from "./header/SiteHeader";
import PageTransition from "./motion/PageTransition";
import SiteFooter from "./SiteFooter";
import MobileBottomNav from "./nav/MobileBottomNav";
import LiveChatWidget from "./support/LiveChatWidget";
import MaintenanceBanner from "./maintenance/MaintenanceBanner";
import MaintenanceGate from "./maintenance/MaintenanceGate";

export default function Layout() {
  return (
    <ShopSettingsProvider>
      <StoreGamesProvider>
        <div className="site-ambient-bg flex min-h-screen w-full min-w-0 flex-col">
          <MaintenanceBanner />
          <ScrollToTop />
          <SiteHeader />

          <main className="layout-main flex-1">
            <MaintenanceGate>
              <PageTransition>
                <Outlet />
              </PageTransition>
            </MaintenanceGate>
          </main>

          <div className="hidden lg:block">
            <SiteFooter />
          </div>

          <MobileBottomNav />
          <LiveChatWidget />
        </div>
      </StoreGamesProvider>
    </ShopSettingsProvider>
  );
}
