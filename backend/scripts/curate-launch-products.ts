/**
 * Launch curation: keep popular games/voucher categories, hide the rest.
 * Run: npx ts-node scripts/curate-launch-products.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_GAME_CODES = new Set([
  'mlbb', 'pubgm', 'freefire', 'freefire_sgmy', 'genshin', 'honkai_star_rail',
  'honkai_impact', 'zzz', 'wuwa', 'valorant', 'hok', 'identityv', 'bloodstrike',
  'arena_breakout', 'codm_sgmy', 'nikke', 'solo_leveling', 'whiteout_survival',
  'marvelrivals', 'deltaforce', 'pgr', 'stumble_guys', 'super_sus', 'oncehuman', 'farlight84',
]);

const KEEP_VOUCHER_KEYWORDS = [
  'steam', 'playstation', 'xbox', 'roblox', 'netflix', 'spotify', 'razer gold',
  'google play', 'itunes', 'apple itunes', 'telegram redeem', 'nintendo', 'amazon usa', 'amazon uae',
];

const HIDE_GAME_CODES = new Set(['test', 'Telegram']);

function keepVoucherCategory(title: string | null | undefined): boolean {
  const t = (title ?? '').toLowerCase();
  return KEEP_VOUCHER_KEYWORDS.some((kw) => t.includes(kw));
}

async function main() {
  const apiKey = process.env.G2BULK_API_KEY?.trim();
  if (!apiKey) throw new Error('G2BULK_API_KEY required');

  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };

  const [gamesRes, vouchersRes] = await Promise.all([
    fetch('https://api.g2bulk.com/v1/games'),
    fetch('https://api.g2bulk.com/v1/products', { headers }),
  ]);
  if (!gamesRes.ok) throw new Error(`G2Bulk games: ${gamesRes.status}`);
  if (!vouchersRes.ok) throw new Error(`G2Bulk vouchers: ${vouchersRes.status}`);

  const gamesJson = (await gamesRes.json()) as {
    games?: { code: string; name: string; image_url?: string | null }[];
  };
  const vouchersJson = (await vouchersRes.json()) as {
    products?: {
      id: number;
      title: string;
      category_title?: string;
      category_id?: number;
      face_value?: number;
      stock?: number;
      description?: string;
    }[];
  };

  const games = gamesJson.games ?? [];
  const vouchers = vouchersJson.products ?? [];

  const [existingGames, existingVouchers] = await Promise.all([
    prisma.product.findMany({ where: { g2bulkGameCode: { not: null } } }),
    prisma.product.findMany({ where: { g2bulkProductId: { not: null } } }),
  ]);

  const gameByCode = new Map(existingGames.map((p) => [p.g2bulkGameCode!, p]));
  const voucherById = new Map(existingVouchers.map((p) => [p.g2bulkProductId!, p]));

  const gameUpdates: { id: number; isActive: boolean }[] = [];
  const gameCreates: Parameters<typeof prisma.product.createMany>[0]['data'] = [];

  let gamesShown = 0;
  let gamesHidden = 0;

  for (const game of games) {
    const active = KEEP_GAME_CODES.has(game.code) && !HIDE_GAME_CODES.has(game.code);
    if (active) gamesShown++;
    else gamesHidden++;

    const row = gameByCode.get(game.code);
    if (row) {
      if (row.isActive !== active) gameUpdates.push({ id: row.id, isActive: active });
    } else if (!active) {
      gameCreates.push({
        name: game.name,
        type: 'direct_topup',
        unitPrice: 0,
        stock: 0,
        isActive: false,
        g2bulkGameCode: game.code,
        imageUrl: game.image_url ?? null,
      });
    }
  }

  const voucherUpdates: { id: number; isActive: boolean }[] = [];
  const voucherCreates: Parameters<typeof prisma.product.createMany>[0]['data'] = [];

  let vouchersShown = 0;
  let vouchersHidden = 0;

  for (const v of vouchers) {
    const active = keepVoucherCategory(v.category_title);
    if (active) vouchersShown++;
    else vouchersHidden++;

    const row = voucherById.get(v.id);
    if (row) {
      if (row.isActive !== active) voucherUpdates.push({ id: row.id, isActive: active });
    } else if (!active) {
      voucherCreates.push({
        name: v.title,
        type: 'voucher',
        unitPrice: 0,
        faceValue: v.face_value ?? null,
        stock: v.stock ?? 0,
        isActive: false,
        g2bulkProductId: v.id,
        categoryId: v.category_id ?? null,
        categoryTitle: v.category_title ?? null,
        description: v.description ?? null,
      });
    }
  }

  const BATCH = 100;
  for (let i = 0; i < gameUpdates.length; i += BATCH) {
    const chunk = gameUpdates.slice(i, i + BATCH);
    await prisma.$transaction(
      chunk.map((u) => prisma.product.update({ where: { id: u.id }, data: { isActive: u.isActive } })),
    );
  }

  for (let i = 0; i < voucherUpdates.length; i += BATCH) {
    const chunk = voucherUpdates.slice(i, i + BATCH);
    await prisma.$transaction(
      chunk.map((u) => prisma.product.update({ where: { id: u.id }, data: { isActive: u.isActive } })),
    );
  }

  if (gameCreates.length) {
    await prisma.product.createMany({ data: gameCreates });
  }
  if (voucherCreates.length) {
    for (let i = 0; i < voucherCreates.length; i += BATCH) {
      await prisma.product.createMany({ data: voucherCreates.slice(i, i + BATCH) });
    }
  }

  await prisma.product.updateMany({
    where: { g2bulkGameCode: { in: [...HIDE_GAME_CODES] } },
    data: { isActive: false },
  });

  console.log('Launch product curation complete');
  console.log(`Games: ${gamesShown} shown, ${gamesHidden} hidden (of ${games.length})`);
  console.log(`Vouchers: ${vouchersShown} shown, ${vouchersHidden} hidden (of ${vouchers.length})`);
  console.log(`DB: ${gameUpdates.length} game updates, ${gameCreates.length} game creates`);
  console.log(`DB: ${voucherUpdates.length} voucher updates, ${voucherCreates.length} voucher creates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
