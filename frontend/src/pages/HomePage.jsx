import { useEffect, useState } from "react";
import FeaturedHero from "../components/FeaturedHero";
import HomeMidBanners from "../components/HomeMidBanners";
import HomeQuickLinks from "../components/HomeQuickLinks";
import ShopEventsSection from "../components/ShopEventsSection";
import TrustStrip from "../components/TrustStrip";
import { useHomeContent } from "../hooks/useHomeContent";

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const { heroBanners, midBanners, events } = useHomeContent();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`home-page ${ready ? "home-page--ready" : ""}`}>
      <FeaturedHero heroBanners={heroBanners} />
      <HomeMidBanners banners={midBanners} />
      <TrustStrip variant="home" />
      <ShopEventsSection events={events} />
      <HomeQuickLinks />
    </div>
  );
}
