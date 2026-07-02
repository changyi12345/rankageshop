/** Static catalog data for the standalone frontend demo (no API). */

export const CURRENCY = "MMK";

/** Demo account: demo@rankage.shop / demo1234 */
export const DEMO_USER = {
  id: "user-demo-1",
  username: "demo",
  email: "demo@rankage.shop",
  password: "demo1234",
  phone: "09123456789",
  wallet_balance: 50000,
  verified: true,
  profile: null,
};

export const ANNOUNCEMENTS = [
  {
    id: "ann-1",
    message: "Welcome to RanKageShop — standalone demo with sample data.",
    link_url: "",
  },
  {
    id: "ann-2",
    message: "Wallet top-ups are reviewed within 30 minutes during business hours.",
    link_url: "/help",
  },
  {
    id: "ann-3",
    message: "PUBG UC, MLBB diamonds, and Free Fire diamonds — instant delivery.",
    link_url: "/games",
  },
];

export const PAYMENT_METHODS = [
  {
    id: "pm-kbz",
    name: "KBZ Pay",
    account_holder_name: "RanKageShop",
    account_number: "09123456789",
    logo_url: null,
  },
  {
    id: "pm-wave",
    name: "Wave Pay",
    account_holder_name: "RanKageShop",
    account_number: "09987654321",
    logo_url: null,
  },
  {
    id: "pm-aya",
    name: "AYA Pay",
    account_holder_name: "RanKageShop",
    account_number: "09456781234",
    logo_url: null,
  },
];

export const INITIAL_TOP_UPS = [
  {
    id: "tu-1",
    amount: 20000,
    status: "approved",
    payment_method_name: "KBZ Pay",
    transaction_last6: "452891",
    created_at: "2025-06-15T04:30:00.000Z",
    admin_note: "",
  },
  {
    id: "tu-2",
    amount: 10000,
    status: "pending",
    payment_method_name: "Wave Pay",
    transaction_last6: "778234",
    created_at: "2025-06-28T08:20:00.000Z",
    admin_note: "",
  },
];

const PUBG_PACKAGES = [
  { name: "60 UC", amount: 1500, currency: CURRENCY },
  { name: "325 UC", amount: 7500, currency: CURRENCY },
  { name: "660 UC", amount: 15000, currency: CURRENCY },
  { name: "1800 UC", amount: 38000, currency: CURRENCY },
  { name: "3850 UC", amount: 75000, currency: CURRENCY },
  { name: "8100 UC", amount: 150000, currency: CURRENCY },
];

const MLBB_PACKAGES_MY = [
  { name: "86 Diamonds", amount: 2500, currency: CURRENCY },
  { name: "172 Diamonds", amount: 5000, currency: CURRENCY },
  { name: "257 Diamonds", amount: 7500, currency: CURRENCY },
  { name: "344 Diamonds", amount: 10000, currency: CURRENCY },
  { name: "706 Diamonds", amount: 20000, currency: CURRENCY },
  { name: "1412 Diamonds", amount: 38000, currency: CURRENCY },
];

const MLBB_PACKAGES_SG = [
  { name: "86 Diamonds", amount: 2800, currency: CURRENCY },
  { name: "172 Diamonds", amount: 5500, currency: CURRENCY },
  { name: "344 Diamonds", amount: 10500, currency: CURRENCY },
  { name: "706 Diamonds", amount: 21000, currency: CURRENCY },
];

const FF_PACKAGES = [
  { name: "100 Diamonds", amount: 1500, currency: CURRENCY },
  { name: "310 Diamonds", amount: 4500, currency: CURRENCY },
  { name: "520 Diamonds", amount: 7500, currency: CURRENCY },
  { name: "1060 Diamonds", amount: 15000, currency: CURRENCY },
  { name: "2180 Diamonds", amount: 30000, currency: CURRENCY },
];

const GENSHIN_PACKAGES = [
  { name: "60 Genesis Crystals", amount: 2000, currency: CURRENCY },
  { name: "300 Genesis Crystals", amount: 10000, currency: CURRENCY },
  { name: "980 Genesis Crystals", amount: 32000, currency: CURRENCY },
  { name: "1980 Genesis Crystals", amount: 62000, currency: CURRENCY },
];

const HOK_PACKAGES = [
  { name: "80 Tokens", amount: 2500, currency: CURRENCY },
  { name: "240 Tokens", amount: 7500, currency: CURRENCY },
  { name: "400 Tokens", amount: 12000, currency: CURRENCY },
  { name: "560 Tokens", amount: 16500, currency: CURRENCY },
];

const COC_PACKAGES = [
  { name: "500 Gems", amount: 5000, currency: CURRENCY },
  { name: "1200 Gems", amount: 12000, currency: CURRENCY },
  { name: "2500 Gems", amount: 24000, currency: CURRENCY },
  { name: "6500 Gems", amount: 58000, currency: CURRENCY },
];

export const GAME_CATALOG = [
  {
    code: "pubgm",
    name: "PUBG Mobile",
    image_url: null,
    min_price: 1500,
    currency: CURRENCY,
    fields: ["userid"],
    regions: [{ code: "global", label: "Global" }],
    packagesByRegion: { global: PUBG_PACKAGES },
    servers: null,
  },
  {
    code: "mlbb",
    name: "Mobile Legends",
    image_url: null,
    min_price: 2500,
    currency: CURRENCY,
    fields: ["userid", "serverid"],
    regions: [
      { code: "my", label: "Malaysia" },
      { code: "sg", label: "Singapore" },
    ],
    packagesByRegion: {
      my: MLBB_PACKAGES_MY,
      sg: MLBB_PACKAGES_SG,
    },
    servers: {
      Asia: [
        { id: "2001", name: "Sunshine" },
        { id: "2002", name: "Moonlight" },
        { id: "2003", name: "Starlight" },
      ],
      Europe: [
        { id: "3001", name: "Valhalla" },
        { id: "3002", name: "Asgard" },
      ],
    },
  },
  {
    code: "freefire",
    name: "Free Fire",
    image_url: null,
    min_price: 1500,
    currency: CURRENCY,
    fields: ["userid"],
    regions: [{ code: "global", label: "Global" }],
    packagesByRegion: { global: FF_PACKAGES },
    servers: null,
  },
  {
    code: "genshin",
    name: "Genshin Impact",
    image_url: null,
    min_price: 2000,
    currency: CURRENCY,
    fields: ["userid", "serverid", "charname"],
    regions: [
      { code: "asia", label: "Asia" },
      { code: "europe", label: "Europe" },
    ],
    packagesByRegion: {
      asia: GENSHIN_PACKAGES,
      europe: GENSHIN_PACKAGES,
    },
    servers: {
      Asia: [
        { id: "os_asia", name: "Asia Server" },
        { id: "os_cht", name: "TW/HK/MO Server" },
      ],
      Europe: [
        { id: "os_euro", name: "Europe Server" },
        { id: "os_usa", name: "America Server" },
      ],
    },
  },
  {
    code: "hok",
    name: "Honor of Kings",
    image_url: null,
    min_price: 2500,
    currency: CURRENCY,
    fields: ["userid"],
    regions: [{ code: "global", label: "Global" }],
    packagesByRegion: { global: HOK_PACKAGES },
    servers: null,
  },
  {
    code: "coc",
    name: "Clash of Clans",
    image_url: null,
    min_price: 5000,
    currency: CURRENCY,
    fields: ["userid"],
    regions: [{ code: "global", label: "Global" }],
    packagesByRegion: { global: COC_PACKAGES },
    servers: null,
  },
];
