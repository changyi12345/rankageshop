import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import ImageIcon from "@mui/icons-material/Image";
import CampaignIcon from "@mui/icons-material/Campaign";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import BarChartIcon from "@mui/icons-material/BarChart";
import HistoryIcon from "@mui/icons-material/History";
import HubIcon from "@mui/icons-material/Hub";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ChatIcon from "@mui/icons-material/Chat";

/** badgeKey maps to useAdminNavStats fields */
export const ADMIN_NAV_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: DashboardIcon, end: true },
    ],
  },
  {
    id: "store",
    label: "Store",
    items: [
      { path: "/admin/products", label: "Products", icon: InventoryIcon },
      { path: "/admin/orders", label: "Orders", icon: ShoppingCartIcon, badgeKey: "pendingOrders" },
      {
        path: "/admin/wallet-topups",
        label: "Wallet Top-ups",
        icon: AccountBalanceWalletIcon,
        badgeKey: "pendingWalletTopups",
      },
      { path: "/admin/wallet-transactions", label: "Wallet Ledger", icon: HistoryIcon },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { path: "/admin/users", label: "Users", icon: PeopleIcon },
      { path: "/admin/live-chat", label: "Live chat", icon: ChatIcon, badgeKey: "pendingChatMessages" },
      { path: "/admin/referrals", label: "Referrals", icon: CardGiftcardIcon },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { path: "/admin/promos", label: "Promos", icon: LocalOfferIcon },
      { path: "/admin/content", label: "Banners & Events", icon: ImageIcon },
      { path: "/admin/notifications", label: "Notifications", icon: NotificationsActiveIcon, badgeKey: "totalPending" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { path: "/admin/g2bulk", label: "G2Bulk", icon: HubIcon, badgeKey: "g2bulkPriceAlertCount" },
      { path: "/admin/reports", label: "Reports", icon: BarChartIcon },
      { path: "/admin/activity", label: "Activity Log", icon: HistoryIcon },
      { path: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export function flattenAdminNavItems() {
  return ADMIN_NAV_SECTIONS.flatMap((section) => section.items);
}
