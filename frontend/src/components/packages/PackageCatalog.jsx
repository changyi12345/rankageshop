import { GAMES_PATH } from "../../config/siteNav";
import { groupPackagesByCategory } from "../../utils/packageDisplay";
import { Link } from "react-router-dom";
import PackageCard from "./PackageCard";

export default function PackageCatalog({
  packages,
  selectedPackage,
  onSelect,
  gameCode,
  gameName,
}) {
  const sections = groupPackagesByCategory(packages);

  if (!packages?.length) {
    return (
      <div className="glass-panel mt-4 p-6 text-center sm:p-8">
        <p className="text-slate-300">No packages available for this game right now.</p>
        <Link to={GAMES_PATH} className="btn-secondary mt-4 inline-flex">
          Browse other games
        </Link>
      </div>
    );
  }

  return (
    <div className="package-catalog">
      <p className="package-catalog__heading">Select top-up package</p>

      {sections.map((section) => (
        <section key={section.id} className="package-catalog__section">
          {sections.length > 1 ? (
            <h3 className="package-catalog__section-title">{section.title}</h3>
          ) : null}

          <ul className="package-catalog__list">
            {section.packages.map((pkg, index) => (
              <li key={pkg.id} className="package-catalog__item">
                <PackageCard
                  pkg={pkg}
                  active={selectedPackage?.id === pkg.id}
                  onSelect={onSelect}
                  gameCode={gameCode}
                  gameName={gameName}
                  animationDelay={Math.min(index, 8) * 40}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
