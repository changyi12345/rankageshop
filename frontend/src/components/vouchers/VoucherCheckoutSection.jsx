import { useState } from "react";
import { Link } from "react-router-dom";
import {
  createVoucherOrder,
  extractVoucherCodes,
  fetchVoucherOrderStatus,
} from "../../api/vouchers";
import { ORDERS_HISTORY_PATH, WALLET_ADD_LABEL_FIRST, WALLET_TOPUP_PATH } from "../../config/siteNav";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useWallet } from "../../hooks/useWallet";
import { formatPrice } from "../../utils/format";
import { normalizeOrderStatus, parseOrderResult } from "../../utils/playerCheckout";
import { getErrorMessage, toast } from "../../utils/toast";
import { LoginPromptCard } from "../RequireAuth";

function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy code.");
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="btn-secondary w-full py-2 text-xs sm:text-sm"
    >
      {copied ? "Copied!" : "Copy code"}
    </button>
  );
}

export default function VoucherCheckoutSection({ product }) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { refreshAll: refreshNotifications } = useNotifications();
  const { balance, refresh: refreshWallet } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderState, setOrderState] = useState({ phase: "idle" });

  const maxQty = Math.min(10, Math.max(1, product.stock ?? 10));
  const unitPrice = product.unit_price;
  const lineTotal = unitPrice != null ? unitPrice * quantity : null;
  const outOfStock = !product.in_stock || (product.stock != null && product.stock <= 0);

  const onPurchase = async () => {
    if (!user) {
      toast.error("Sign in to pay from your wallet.");
      return;
    }
    if (outOfStock) {
      toast.error("This voucher is out of stock.");
      return;
    }
    if (lineTotal != null && balance < lineTotal) {
      toast.error(`Insufficient wallet balance. ${WALLET_ADD_LABEL_FIRST}.`);
      return;
    }

    setOrderLoading(true);
    setOrderState({ phase: "loading" });
    try {
      const result = await createVoucherOrder({
        g2bulkProductId: product.id,
        unitPrice: unitPrice,
        quantity,
      });
      let statusResult = result;
      const orderId = result?.id ?? result?.order_id ?? result?.primaryOrderId;
      if (orderId) {
        try {
          statusResult = await fetchVoucherOrderStatus(orderId);
        } catch {
          /* keep create response */
        }
      }
      const parsed = parseOrderResult(statusResult?.order ? statusResult : result);
      const codes = extractVoucherCodes(statusResult?.order ? statusResult : result);
      setOrderState({
        phase: "success",
        message: parsed.message,
        orderId: parsed.orderId,
        status: normalizeOrderStatus(parsed.status),
        codes,
      });
      await Promise.all([refreshWallet(), refreshUser(), refreshNotifications()]);
    } catch (err) {
      setOrderState({
        phase: "error",
        message: getErrorMessage(err, "Purchase failed. Please try again."),
      });
    } finally {
      setOrderLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <section className="checkout-section mt-8">
        <LoginPromptCard message="Sign in to buy vouchers with your wallet balance." />
      </section>
    );
  }

  if (orderState.phase === "success") {
    return (
      <section className="checkout-section mt-8">
        <div className="order-receipt-card">
          <div className="order-receipt-card__header">
            <span className="status-card__icon status-card__icon--success" aria-hidden>
              ✓
            </span>
            <div>
              <h2 className="order-receipt-card__title">Voucher order placed</h2>
              <p className="order-receipt-card__subtitle">{orderState.message}</p>
              {orderState.orderId ? (
                <p className="mt-1 text-xs text-slate-500">Order #{orderState.orderId}</p>
              ) : null}
            </div>
          </div>
          {orderState.codes?.length ? (
            <ul className="mt-5 space-y-3">
              {orderState.codes.map((code) => (
                <li
                  key={code}
                  className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent-light">
                    Your code
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-white">{code}</p>
                  <div className="mt-3">
                    <CopyCodeButton code={code} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Your voucher code will appear here once fulfillment completes.{" "}
              <Link to={ORDERS_HISTORY_PATH} className="text-accent-light hover:underline">
                View order history
              </Link>{" "}
              if it is still processing.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-section mt-8">
      <div className="checkout-summary-card">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Checkout</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-400">Price</dt>
            <dd className="font-semibold text-white">
              {formatPrice(unitPrice, product.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-400">Quantity</dt>
            <dd>
              <select
                className="input-field py-2"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={orderLoading || outOfStock}
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-surface-border pt-3">
            <dt className="font-semibold text-slate-300">Total</dt>
            <dd className="text-lg font-bold text-accent-light">
              {formatPrice(lineTotal, product.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <dt className="text-slate-500">Wallet balance</dt>
            <dd className="text-slate-300">{formatPrice(balance)}</dd>
          </div>
        </dl>

        {orderState.phase === "error" ? (
          <p className="field-error mt-4" role="alert">
            {orderState.message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={onPurchase}
            disabled={orderLoading || outOfStock}
          >
            {orderLoading ? "Processing…" : outOfStock ? "Out of stock" : "Pay with wallet"}
          </button>
          {balance < (lineTotal ?? 0) ? (
            <Link to={WALLET_TOPUP_PATH} className="btn-secondary flex-1 text-center">
              Add balance
            </Link>
          ) : null}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Voucher codes are delivered instantly after payment. Save your code — it may not be shown
          again.
        </p>
      </div>
    </section>
  );
}
