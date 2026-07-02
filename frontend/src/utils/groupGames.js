import { isMlbbVariant, MLBB_UNIFIED_CODE } from "./mlbb-regions";

export function groupGamesForDisplay(games) {
  const mlbbVariants = games.filter((g) => isMlbbVariant(g.code));
  const others = games.filter((g) => !isMlbbVariant(g.code));

  if (mlbbVariants.length === 0) return games;

  const primary = mlbbVariants.find((g) => g.code === "mlbb") ?? mlbbVariants[0];
  const minPrice = mlbbVariants.reduce((min, g) => {
    if (g.min_price == null) return min;
    return min == null ? g.min_price : Math.min(min, g.min_price);
  }, null);

  const unified = {
    ...primary,
    code: MLBB_UNIFIED_CODE,
    name: "Mobile Legends: Bang Bang",
    min_price: minPrice,
    currency: primary.currency ?? "MMK",
    isMlbbUnified: true,
  };

  return [unified, ...others];
}
