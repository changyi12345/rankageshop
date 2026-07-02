import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function getRoleColor(role) {
  return role === "ADMIN"
    ? "border-blue-200 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
    : "border-blue-200 bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800";
}

export default function UserDetailModal({ user, onClose, onUpdated, onEdit, onAdjustWallet, onRoleChange, onBan, onUnban }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setOrdersLoading(true);
    adminApi
      .getUserOrders(user.id)
      .then((res) => {
        if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load user orders");
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const adjustWallet = () => {
    onAdjustWallet?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 text-lg font-bold text-white">
              {user.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-blue-900">{user.username}</h2>
              <span className={`inline-flex rounded-xl border px-3 py-0.5 text-xs font-black ${getRoleColor(user.role)}`}>
                {user.role || "USER"}
              </span>
              {user.isBanned ? (
                <span className="ml-2 inline-flex rounded-xl border border-slate-300 bg-slate-200 px-3 py-0.5 text-xs font-black text-slate-800">
                  Banned
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <DetailSection title="Account">
            <DetailRow label="User ID" value={`#${user.id}`} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Phone" value={user.phone || "-"} />
            <DetailRow
              label="Email verified"
              value={user.emailVerified ? "Yes" : "No"}
              badge={user.emailVerified ? "verified" : "pending"}
            />
            <DetailRow
              label="Phone verified"
              value={user.phoneVerified ? "Yes" : "No"}
              badge={user.phoneVerified ? "verified" : null}
            />
            <DetailRow label="Referral code" value={user.referralCode || "-"} />
            <DetailRow label="Joined" value={formatDateTime(user.createdAt)} />
            {user.isBanned ? (
              <>
                <DetailRow label="Banned at" value={formatDateTime(user.bannedAt)} />
                <DetailRow label="Ban reason" value={user.banReason || "No reason provided"} />
              </>
            ) : null}
          </DetailSection>

          <DetailSection title="Wallet & activity">
            <DetailRow
              label="Wallet balance"
              value={`MMK ${(user.walletBalance ?? 0).toLocaleString()}`}
              highlight
            />
            <DetailRow label="Total orders" value={user.orderCount ?? 0} />
          </DetailSection>

          <DetailSection title="Recent orders">
            {ordersLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-blue-500">No orders yet</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {orders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-blue-900">#{order.id} — {order.productName}</p>
                      <p className="text-xs text-blue-500">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">MMK {(order.totalPrice ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-blue-500">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
          <ActionButton
            label="Edit user"
            icon={EditIcon}
            onClick={() => onEdit?.()}
          />
          <ActionButton
            label={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
            icon={user.role === "ADMIN" ? PersonIcon : AdminPanelSettingsIcon}
            onClick={() => onRoleChange?.()}
          />
          <ActionButton
            label="Adjust wallet"
            icon={AccountBalanceWalletIcon}
            onClick={adjustWallet}
            variant="success"
          />
          {user.isBanned ? (
            <ActionButton
              label="Unban user"
              icon={LockOpenIcon}
              onClick={() => onUnban?.()}
            />
          ) : user.role !== "ADMIN" ? (
            <ActionButton
              label="Ban user"
              icon={BlockIcon}
              onClick={() => onBan?.()}
              variant="danger"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-blue-500">{label}</span>
      <div className="text-right">
        <span className={`font-medium ${highlight ? "text-lg font-extrabold text-blue-900" : "text-blue-900"}`}>
          {value ?? "-"}
        </span>
        {badge === "verified" ? (
          <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            <VerifiedIcon sx={{ fontSize: 12 }} />
            Verified
          </span>
        ) : badge === "pending" ? (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            Pending
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick, disabled, variant }) {
  const styles = {
    default: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
    success: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    danger: "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant || "default"]}`}
    >
      <Icon sx={{ fontSize: 16 }} />
      {label}
    </button>
  );
}
