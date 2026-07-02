import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Mobile Legends 100 Diamonds', type: 'direct_topup', unitPrice: 35000, stock: 100, g2bulkGameCode: 'mlbb' },
    { name: 'PUBG Mobile 60 UC Voucher', type: 'voucher', unitPrice: 18000, stock: 80 },
    { name: 'Free Fire 50 Diamonds', type: 'direct_topup', unitPrice: 12000, stock: 50, g2bulkGameCode: 'freefire' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  const promos = [
    {
      code: 'WELCOME10',
      discountPercent: 10,
      maxUsage: 100,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
    },
    {
      code: 'SAVE10',
      discountPercent: 10,
      maxUsage: 500,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
    },
  ];

  for (const promo of promos) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: promo,
    });
  }

  await prisma.shopSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shopName: 'RanKageShop',
      paymentMethods: ['KBZ Pay', 'Wave Pay', 'Bank Transfer'],
      usdToMmkRate: 4500,
      priceMarkupPercent: 0,
      minWalletTopup: 1000,
    },
  });

  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { role: 'ADMIN' },
    create: {
      username: 'admin',
      email: 'admin@rankage.shop',
      password: adminPassword,
      role: 'ADMIN',
      referralCode: 'RANKAGE-ADMIN',
    },
  });

  console.log('Seed completed — admin login: admin / admin123');

  const announcementCount = await prisma.shopBanner.count({
    where: { position: 'announcement' },
  });
  if (announcementCount === 0) {
    await prisma.shopBanner.create({
      data: {
        title: 'Instant game delivery · Pay with local wallets · Prices in MMK',
        imageUrl: '__announcement__',
        position: 'announcement',
        sortOrder: 0,
        isActive: true,
      },
    });
  }

  const eventCount = await prisma.shopEvent.count();
  if (eventCount === 0) {
    await prisma.shopEvent.create({
      data: {
        title: 'Grand Opening Promo — 10% Off',
        slug: 'grand-opening-promo',
        excerpt: 'WELCOME10 promo code ဖြင့် checkout မှာ 10% off ရယူပါ',
        content: 'RanKageShop အွန်လိုင်း shop ဖွင့်လှစ်ခြင်း အခမ်းအနားအတွက် WELCOME10 promo code ကို checkout မှာ သုံးပြီး 10% discount ရယူနိုင်ပါတယ်။\n\nMobile Legends, PUBG, Free Fire top-up နှင့် voucher များ အားလုံး အသုံးပြုနိုင်ပါသည်။',
        isPublished: true,
        isPinned: true,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
