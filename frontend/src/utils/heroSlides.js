import { gradientForCode } from "./gradients";

/**
 * Build hero carousel slides from games and voucher categories.
 * @param {object[]} games
 * @param {object[]} voucherCategories
 */
export function buildHeroSlides(games = [], voucherCategories = []) {
  const slides = [];

  for (const game of games) {
    if (!game?.code) continue;
    slides.push({
      id: `game-${game.code}`,
      type: "game",
      typeLabel: "Game top-up",
      title: game.name || game.code,
      subtitle: "Choose a package and top up in seconds.",
      imageUrl: game.image_url || null,
      href: `/games/${game.code}`,
      gradient: gradientForCode(game.code),
    });
    if (slides.filter((s) => s.type === "game").length >= 5) break;
  }

  for (const category of voucherCategories) {
    if (!category?.id) continue;
    slides.push({
      id: `voucher-${category.id}`,
      type: "voucher",
      typeLabel: "Voucher",
      title: category.title,
      subtitle: "Gift cards and digital codes — instant delivery.",
      imageUrl: category.image_url || null,
      href: `/vouchers?category=${category.id}`,
      gradient: "from-blue-600/40 to-slate-900",
    });
    if (slides.filter((s) => s.type === "voucher").length >= 4) break;
  }

  return slides;
}

export function filterHeroSlides(slides, type) {
  if (!type || type === "all") return slides;
  return slides.filter((slide) => slide.type === type);
}
