import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import AuthShellLayout from "./components/auth/AuthShellLayout";
import AdminLayout from "./components/admin/AdminLayout";
import VouchersPage from "./pages/VouchersPage";
import VoucherDetailPage from "./pages/VoucherDetailPage";
import GameDetailPage from "./pages/GameDetailPage";
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import PromotionsPage from "./pages/PromotionsPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HelpPage from "./pages/HelpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";
import WalletTopUpPage from "./pages/WalletTopUpPage";
import WalletHistoryPage from "./pages/WalletHistoryPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import UserNotificationsPage from "./pages/UserNotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileEditPage from "./pages/ProfileEditPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import AccountDeleteRequestPage from "./pages/AccountDeleteRequestPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProductsPage from "./pages/admin/ProductsPage";
import OrdersPage from "./pages/admin/OrdersPage";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import PromosPage from "./pages/admin/PromosPage";
import WalletTopupsPage from "./pages/admin/WalletTopupsPage";
import WalletTransactionsPage from "./pages/admin/WalletTransactionsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import ContentPage from "./pages/admin/ContentPage";
import AdminNotificationsPage from "./pages/admin/NotificationsPage";
import ReferralsPage from "./pages/admin/ReferralsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import ActivityPage from "./pages/admin/ActivityPage";
import G2bulkPage from "./pages/admin/G2bulkPage";
import LiveChatPage from "./pages/admin/LiveChatPage";

function LegacyAuthRedirect({ to }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthShellLayout />}>
        <Route path="auth/verify-email" element={<LegacyAuthRedirect to="/verify-email" />} />
        <Route path="auth/reset-password" element={<LegacyAuthRedirect to="/reset-password" />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="activate-account" element={<ActivateAccountPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:gameId" element={<GameDetailPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="vouchers/:id" element={<VoucherDetailPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="wallet/top-up" element={<WalletTopUpPage />} />
        <Route path="wallet/history" element={<WalletHistoryPage />} />
        <Route path="orders/history" element={<OrderHistoryPage />} />
        <Route path="notifications" element={<UserNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/edit" element={<ProfileEditPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="account/delete-request" element={<AccountDeleteRequestPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="promos" element={<PromosPage />} />
        <Route path="wallet-topups" element={<WalletTopupsPage />} />
        <Route path="wallet-transactions" element={<WalletTransactionsPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="live-chat" element={<LiveChatPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="g2bulk" element={<G2bulkPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
