import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import VerifiedIcon from "@mui/icons-material/Verified";
import BlockIcon from "@mui/icons-material/Block";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";
import ReasonInputModal from "./ReasonInputModal";

const STATUS_COLORS = {
  completed: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800",
  processing: "border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800",
  pending: "border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700",
  payment_pending: "border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700",
  cancelled: "border-gray-200 bg-gray-100 text-gray-700",
  failed: "border-slate-300 bg-slate-200 text-slate-800",
};

export function getStatusColor(status) {
  return STATUS_COLORS[status?.toLowerCase()] || "border-gray-200 bg-gray-100 text-gray-800";
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function OrderDetailModal({ orderId, onClose, onUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [reasonModal, setReasonModal] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    adminApi
      .getOrderDetail(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load order details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const runAction = async (label, fn) => {
    setActing(true);
    try {
      await fn();
      toast.success(label);
      const res = await adminApi.getOrderDetail(orderId);
      setOrder(res.data);
      onUpdated?.();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  const updateStatus = (status) =>
    runAction("Order status updated", () => adminApi.updateOrderStatus(orderId, status));

  const verifyPayment = () =>
    runAction("Payment verified", () => adminApi.verifyPayment(orderId));

  const retryFulfillment = () =>
    runAction("Fulfillment retried", () => adminApi.retryFulfillment(orderId));

  const rejectPayment = () => setReasonModal("reject");

  const refundOrder = () => setReasonModal("refund");

  const confirmReasonAction = async (reason) => {
    if (!reasonModal) return;
    setActing(true);
    try {
      if (reasonModal === "reject") {
        await adminApi.rejectPayment(orderId, { reason });
        toast.success("Payment rejected");
      } else {
        await adminApi.refundOrder(orderId, reason);
        toast.success("Order refunded");
      }
      const res = await adminApi.getOrderDetail(orderId);
      setOrder(res.data);
      onUpdated?.();
      setReasonModal(null);
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  if (!orderId) return null;

  const status = order?.status?.toLowerCase();
  const canProcess = ["pending", "payment_pending"].includes(status);
  const canVerify = order?.paymentProof && ["pending", "payment_pending"].includes(status);
  const canRetry = ["pending", "payment_pending", "processing"].includes(status);
  const canReject = order?.paymentProof && ["pending", "payment_pending"].includes(status);
  const canRefund = ["completed", "processing", "payment_pending"].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-white to-blue-50 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-blue-900">Order #{orderId}</h2>
            {order ? (
              <span className={`mt-1 inline-flex rounded-xl border px-3 py-1 text-xs font-black ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            ) : null}
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

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : order ? (
            <div className="space-y-5">
              <DetailSection title="Customer">
                <DetailRow label="Username" value={order.user?.username} />
                <DetailRow label="Email" value={order.user?.email} />
              </DetailSection>

              <DetailSection title="Product">
                <DetailRow label="Name" value={order.product?.name} />
                <DetailRow label="Type" value={order.type || order.product?.type} />
                <DetailRow label="Quantity" value={order.quantity} />
                <DetailRow
                  label="Total"
                  value={`MMK ${(order.totalPrice ?? 0).toLocaleString()}`}
                  highlight
                />
                <DetailRow label="Payment" value={order.paymentMethod || "-"} />
              </DetailSection>

              {order.topUpInput ? (
                <DetailSection title="Player info">
                  <DetailRow label="Game" value={order.topUpInput.gameCode} />
                  <DetailRow label="Player ID" value={order.topUpInput.playerId} />
                  <DetailRow label="Server" value={order.topUpInput.serverId || "-"} />
                  <DetailRow label="Player name" value={order.topUpInput.playerName || "-"} />
                  <DetailRow label="Package" value={order.topUpInput.catalogueName} />
                </DetailSection>
              ) : null}

              {order.voucherCodes?.length ? (
                <DetailSection title="Voucher codes">
                  {order.voucherCodes.map((code) => (
                    <p key={code} className="rounded-lg bg-blue-50 px-3 py-2 font-mono text-sm text-blue-900">
                      {code}
                    </p>
                  ))}
                </DetailSection>
              ) : null}

              {order.paymentProof ? (
                <DetailSection title="Payment proof">
                  <DetailRow label="Method" value={order.paymentProof.method} />
                  <DetailRow label="Reference" value={order.paymentProof.reference || "-"} />
                  <DetailRow label="Status" value={order.paymentProof.status} />
                  {order.paymentProof.imageUrl ? (
                    <a
                      href={resolveUploadUrl(order.paymentProof.imageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block"
                    >
                      <img
                        src={resolveUploadUrl(order.paymentProof.imageUrl)}
                        alt="Payment proof"
                        className="max-h-48 rounded-xl border border-blue-200 object-contain"
                      />
                    </a>
                  ) : null}
                </DetailSection>
              ) : null}

              <DetailSection title="Timeline">
                <DetailRow label="Created" value={formatDateTime(order.createdAt)} />
                <DetailRow label="Completed" value={formatDateTime(order.completedAt)} />
                {order.remark ? <DetailRow label="Remark" value={order.remark} /> : null}
              </DetailSection>
            </div>
          ) : (
            <p className="py-8 text-center text-blue-600">Order not found</p>
          )}
        </div>

        {order ? (
          <div className="flex flex-wrap gap-2 border-t border-blue-100 bg-blue-50/50 p-4">
            <ActionButton
              label="Process"
              icon={RefreshIcon}
              disabled={acting || !canProcess}
              onClick={() => updateStatus("PROCESSING")}
            />
            <ActionButton
              label="Verify payment"
              icon={VerifiedIcon}
              disabled={acting || !canVerify}
              onClick={verifyPayment}
            />
            <ActionButton
              label="Retry"
              icon={ReplayIcon}
              disabled={acting || !canRetry}
              onClick={retryFulfillment}
            />
            <ActionButton
              label="Reject proof"
              icon={BlockIcon}
              disabled={acting || !canReject}
              onClick={rejectPayment}
              variant="danger"
            />
            <ActionButton
              label="Refund"
              icon={MoneyOffIcon}
              disabled={acting || !canRefund}
              onClick={refundOrder}
              variant="danger"
            />
          </div>
        ) : null}
      </div>

      {reasonModal ? (
        <ReasonInputModal
          title={reasonModal === "refund" ? "Refund order" : "Reject payment proof"}
          message={
            reasonModal === "refund"
              ? "This will refund the order to the customer's wallet."
              : "The payment proof will be rejected and the order may need a new proof."
          }
          confirmLabel={reasonModal === "refund" ? "Refund" : "Reject"}
          loading={acting}
          onConfirm={confirmReasonAction}
          onClose={() => !acting && setReasonModal(null)}
        />
      ) : null}
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

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-blue-500">{label}</span>
      <span className={`text-right font-medium ${highlight ? "text-lg font-extrabold text-blue-900" : "text-blue-900"}`}>
        {value ?? "-"}
      </span>
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
