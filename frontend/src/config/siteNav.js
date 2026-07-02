/** Primary header navigation — game top-up platform style */

export const HEADER_ANNOUNCEMENT =
  "Instant game delivery · Pay with local wallets · Prices in MMK";

export const WALLET_TOPUP_PATH = "/wallet/top-up";
export const WALLET_HISTORY_PATH = "/wallet/history";
export const ORDERS_HISTORY_PATH = "/orders/history";
export const NOTIFICATIONS_PATH = "/notifications";

/** Auth & account copy — single source of truth */
export const AUTH_SIGN_IN_LABEL = "Sign in";
export const AUTH_SIGN_UP_LABEL = "Create account";
export const AUTH_LOG_OUT_LABEL = "Log out";

/** User-facing wallet deposit copy (buttons, links, headings) */
export const WALLET_ADD_LABEL = "Add balance";
export const WALLET_ADD_LABEL_LONG = "Top up your wallet";
export const WALLET_ADD_LABEL_FIRST = "Add balance first";
export const WALLET_HISTORY_LABEL = "Wallet top-up history";
export const ORDERS_HISTORY_LABEL = "Order history";
export const NOTIFICATIONS_LABEL = "Notifications";

export const PROFILE_PATH = "/profile";
export const PROFILE_EDIT_PATH = "/profile/edit";

export const HOME_PATH = "/";

export const GAMES_PATH = "/games";
export const VOUCHERS_PATH = "/vouchers";
export const PROMOTIONS_PATH = "/promotions";
export const HOW_IT_WORKS_PATH = "/how-it-works";
export const HELP_PATH = "/help";
export const CONTACT_SUPPORT_PATH = `${HELP_PATH}#contact-support`;
export const PRIVACY_PATH = "/privacy";
export const ACCOUNT_DELETE_PATH = "/account/delete-request";

/** @deprecated Use GAMES_PATH — kept for imports migrating off hash URLs */
export const catalogHref = GAMES_PATH;

/** Old home hash anchors → dedicated routes */
export const LEGACY_HASH_REDIRECTS = {
  catalog: GAMES_PATH,
  promotions: PROMOTIONS_PATH,
  "how-it-works": HOW_IT_WORKS_PATH,
  help: HELP_PATH,
};

export const MAIN_NAV = [
  { id: "home", label: "Home", href: HOME_PATH, icon: "home" },
  { id: "topup", label: "Top Up", href: WALLET_TOPUP_PATH, primary: true },
  { id: "games", label: "Games", href: GAMES_PATH },
  { id: "vouchers", label: "Voucher", href: VOUCHERS_PATH },
  { id: "promos", label: "Promotions", href: PROMOTIONS_PATH },
  { id: "how", label: "How it works", href: HOW_IT_WORKS_PATH },
  { id: "help", label: "Help", href: HELP_PATH },
];

/** Left drawer (mobile) — icon id matches NavIcons */
export const DRAWER_NAV = [
  { id: "home", label: "Home", href: HOME_PATH, icon: "home" },
  { id: "games", label: "Games", href: GAMES_PATH, icon: "games" },
  { id: "vouchers", label: "Voucher", href: VOUCHERS_PATH, icon: "voucher" },
  {
    id: "login",
    label: AUTH_SIGN_IN_LABEL,
    href: "/login",
    icon: "user",
    guestOnly: true,
  },
  {
    id: "register",
    label: AUTH_SIGN_UP_LABEL,
    href: "/register",
    icon: "userPlus",
    guestOnly: true,
  },
  { id: "topup", label: WALLET_ADD_LABEL, href: WALLET_TOPUP_PATH, icon: "wallet" },
  {
    id: "order-history",
    label: ORDERS_HISTORY_LABEL,
    href: ORDERS_HISTORY_PATH,
    icon: "orders",
    requiresAuth: true,
  },
  {
    id: "notifications",
    label: NOTIFICATIONS_LABEL,
    href: NOTIFICATIONS_PATH,
    icon: "bell",
    requiresAuth: true,
  },
  {
    id: "topup-history",
    label: WALLET_HISTORY_LABEL,
    href: WALLET_HISTORY_PATH,
    icon: "history",
    requiresAuth: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: PROFILE_PATH,
    icon: "profile",
    requiresAuth: true,
  },
  { id: "promos", label: "Promotions", href: PROMOTIONS_PATH, icon: "promo" },
  { id: "how", label: "How it works", href: HOW_IT_WORKS_PATH, icon: "info" },
  { id: "help", label: "Help & Support", href: HELP_PATH, icon: "support" },
];

export const DRAWER_AUTH_USER = [
  {
    id: "logout",
    label: AUTH_LOG_OUT_LABEL,
    href: "#logout",
    icon: "logout",
    action: "logout",
  },
];

/** Bottom tab bar (mobile only) */
export const BOTTOM_NAV = [
  { id: "home", label: "Home", href: "/", icon: "home", match: (p) => p === "/" },
  {
    id: "games",
    label: "Games",
    href: GAMES_PATH,
    icon: "shop",
    match: (p) => p === GAMES_PATH || p.startsWith("/games/"),
  },
  { id: "topup", label: "Top Up", href: WALLET_TOPUP_PATH, icon: "topupFab", center: true },
  {
    id: "vouchers",
    label: "Voucher",
    href: VOUCHERS_PATH,
    icon: "voucher",
    match: (p) => p === VOUCHERS_PATH || p.startsWith("/vouchers/"),
  },
  {
    id: "profile",
    label: "Profile",
    href: "/login",
    icon: "profile",
    match: (p, user) =>
      user
        ? p === PROFILE_PATH ||
          p.startsWith("/profile/") ||
          p.startsWith(ORDERS_HISTORY_PATH) ||
          p.startsWith(NOTIFICATIONS_PATH) ||
          p.startsWith("/wallet/history")
        : p === "/login" || p === "/register",
    requiresAuth: true,
    authHref: PROFILE_PATH,
    guestHref: "/login",
  },
];
