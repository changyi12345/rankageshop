import { useEffect, useState } from "react";
import FeaturedHero from "../components/FeaturedHero";
import HomeQuickLinks from "../components/HomeQuickLinks";
import TrustStrip from "../components/TrustStrip";

export default function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`home-page ${ready ? "home-page--ready" : ""}`}>
      <FeaturedHero />
      <TrustStrip variant="home" />
      <HomeQuickLinks />
    </div>
  );
}
