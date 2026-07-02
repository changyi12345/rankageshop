import { Link } from "react-router-dom";
import { WALLET_TOPUP_PATH } from "../../config/siteNav";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../hooks/useWallet";
import { formatPrice } from "../../utils/format";
import { NavIcon } from "../nav/NavIcons";

export default function HeaderWalletBalance({ className = "" }) {
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: walletLoading } = useWallet();

  if (authLoading || !user) return null;

  const formatted = formatPrice(balance, "MMK");

  return (
    <Link
      to={WALLET_TOPUP_PATH}
      className={`header-wallet-balance ${className}`.trim()}
      aria-label={`Wallet balance: ${formatted}. Top up wallet`}
    >
      <NavIcon name="wallet" className="header-wallet-balance__icon" />
      <span className="header-wallet-balance__amount">
        {walletLoading ? "…" : formatted}
      </span>
    </Link>
  );
}
