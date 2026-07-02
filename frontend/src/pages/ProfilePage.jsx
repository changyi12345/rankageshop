import { Link, useNavigate } from "react-router-dom";
import { BRAND_FULL_NAME } from "../constants/brand";
import {
  ACCOUNT_DELETE_PATH,
  AUTH_LOG_OUT_LABEL,
  GAMES_PATH,
  ORDERS_HISTORY_LABEL,
  ORDERS_HISTORY_PATH,
  NOTIFICATIONS_LABEL,
  NOTIFICATIONS_PATH,
  PROFILE_EDIT_PATH,
  PRIVACY_PATH,
  VOUCHERS_PATH,
  WALLET_HISTORY_PATH,
  WALLET_HISTORY_LABEL,
  WALLET_ADD_LABEL,
  WALLET_TOPUP_PATH,
} from "../config/siteNav";
import ProfileMenuRow from "../components/profile/ProfileMenuRow";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../hooks/useWallet";
import UserAvatar from "../components/UserAvatar";
import { formatPrice } from "../utils/format";
import { toast } from "../utils/toast";

function ProfileContent() {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const displayName = user?.username || user?.email?.split("@")[0] || "Account";
  const userTag = user?.username ? `@${user.username}` : user?.id?.slice(0, 8);

  const copyUserId = async () => {
    const text = user?.username || user?.id || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(user.username ? `@${user.username}` : text);
      toast.success("User ID copied.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  const handleShare = async () => {
    const url = window.location.origin;
    const payload = {
      title: BRAND_FULL_NAME,
      text: `Top up games on ${BRAND_FULL_NAME}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") toast.error("Could not share.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("You have been logged out.");
  };

  return (
    <div className="profile-page">
      <section className="profile-hero" aria-label="Account overview">
        <div className="profile-hero__glow" aria-hidden />

        <div className="profile-hero__identity">
          <UserAvatar user={user} name={displayName} size="lg" className="profile-hero__avatar" />
          <div className="profile-hero__info">
            <p className="profile-hero__eyebrow">My account</p>
            <h1 className="profile-hero__name">{displayName}</h1>
            {user?.email ? <p className="profile-hero__email">{user.email}</p> : null}
            {userTag ? (
              <button
                type="button"
                className="profile-hero__tag"
                onClick={copyUserId}
                title="Copy user ID"
              >
                {userTag}
              </button>
            ) : null}
          </div>
        </div>

        <aside className="profile-hero__wallet">
          <p className="profile-hero__wallet-label">Wallet balance</p>
          <p className="profile-hero__wallet-amount">{formatPrice(balance, "MMK")}</p>
          <div className="profile-hero__wallet-actions">
            <Link to={WALLET_TOPUP_PATH} className="btn-primary profile-hero__cta">
              {WALLET_ADD_LABEL}
            </Link>
            <Link to={ORDERS_HISTORY_PATH} className="btn-secondary profile-hero__cta">
              Orders
            </Link>
          </div>
        </aside>
      </section>

      <div className="profile-layout">
        <section className="profile-panel">
          <h2 className="profile-panel__title">Account</h2>
          <div className="profile-card">
            <ProfileMenuRow
              icon="profile"
              title="Edit profile"
              subtitle="Photo, username, phone"
              to={PROFILE_EDIT_PATH}
            />
            <ProfileMenuRow
              icon="copy"
              title="User ID"
              subtitle="Tap to copy"
              onClick={copyUserId}
              trailing={<span className="profile-menu-row__value">{userTag}</span>}
            />
          </div>
        </section>

        <section className="profile-panel">
          <h2 className="profile-panel__title">Shop</h2>
          <div className="profile-card">
            <ProfileMenuRow
              icon="orders"
              title={ORDERS_HISTORY_LABEL}
              subtitle="Game top-ups and voucher purchases"
              to={ORDERS_HISTORY_PATH}
            />
            <ProfileMenuRow
              icon="bell"
              title={NOTIFICATIONS_LABEL}
              subtitle="Order and wallet updates"
              to={NOTIFICATIONS_PATH}
            />
            <ProfileMenuRow
              icon="games"
              title="Browse games"
              subtitle="PUBG, MLBB, Free Fire & more"
              to={GAMES_PATH}
            />
            <ProfileMenuRow
              icon="voucher"
              title="Voucher shop"
              subtitle="Gift cards and digital codes"
              to={VOUCHERS_PATH}
            />
          </div>
        </section>

        <section className="profile-panel">
          <h2 className="profile-panel__title">Wallet</h2>
          <div className="profile-card">
            <ProfileMenuRow
              icon="wallet"
              title={WALLET_ADD_LABEL}
              subtitle="Add MMK to your balance"
              to={WALLET_TOPUP_PATH}
            />
            <ProfileMenuRow
              icon="history"
              title={WALLET_HISTORY_LABEL}
              subtitle="Wallet deposit requests"
              to={WALLET_HISTORY_PATH}
            />
          </div>
        </section>

        <section className="profile-panel">
          <h2 className="profile-panel__title">More</h2>
          <div className="profile-card">
            <ProfileMenuRow
              icon="support"
              title="Privacy policy"
              subtitle="How we handle your data"
              to={PRIVACY_PATH}
            />
            <ProfileMenuRow
              icon="trash"
              title="Delete account"
              subtitle="Submit a deletion request"
              to={ACCOUNT_DELETE_PATH}
              danger="danger"
            />
            <ProfileMenuRow
              icon="promo"
              title="Share"
              subtitle={`Share ${BRAND_FULL_NAME} with friends`}
              onClick={handleShare}
            />
            <ProfileMenuRow
              icon="info"
              title="About"
              subtitle="About RanKageShop"
              to="/about"
            />
          </div>
        </section>

        <section className="profile-panel profile-panel--danger">
          <h2 className="profile-panel__title">Session</h2>
          <div className="profile-card profile-card--danger">
            <ProfileMenuRow
              icon="logout"
              title={AUTH_LOG_OUT_LABEL}
              subtitle="Sign out on this device"
              onClick={handleLogout}
              danger="warning"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <div className="site-container site-container--profile py-5 sm:py-8 lg:py-10">
        <ProfileContent />
      </div>
    </RequireAuth>
  );
}
