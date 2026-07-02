import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchPaymentMethods, submitWalletTopUp } from "../api/wallet";
import CopyableText from "../components/CopyableText";
import RequireAuth from "../components/RequireAuth";
import { ORDERS_HISTORY_PATH, WALLET_ADD_LABEL_LONG, WALLET_HISTORY_LABEL, WALLET_HISTORY_PATH } from "../config/siteNav";
import { TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS } from "../constants/wallet";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../hooks/useWallet";
import { formatNumber, formatPrice } from "../utils/format";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { toast } from "../utils/toast";

const AMOUNT_CUSTOM = "custom";

function formatMmk(amount) {
  return formatPrice(amount, "MMK");
}

function parseMmkInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function formatMmkInput(value) {
  const n = parseMmkInput(value);
  if (n == null) return "";
  return formatNumber(n);
}

function amountInRange(n) {
  return n != null && n >= TOPUP_MIN && n <= TOPUP_MAX;
}

function AmountChip({ value, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`wallet-amount-chip ${selected ? "wallet-amount-chip--active" : ""}`}
      onClick={() => onSelect(value)}
    >
      {formatMmk(value)}
    </button>
  );
}

function PaymentMethodCard({ method, selected, onSelect }) {
  const inputId = useId();
  const logoSrc = resolveMediaUrl(method.logo_url);

  return (
    <div
      className={`wallet-pay-card wallet-pay-card--selectable ${selected ? "wallet-pay-card--active" : ""}`}
    >
      <input
        type="radio"
        id={inputId}
        name="wallet-payment-method"
        className="sr-only"
        checked={selected}
        onChange={() => onSelect(method.id)}
      />
      <label htmlFor={inputId} className="wallet-pay-card__head">
        {logoSrc ? (
          <img src={logoSrc} alt="" className="wallet-pay-card__logo" />
        ) : (
          <span className="wallet-pay-card__logo wallet-pay-card__logo--placeholder">
            {method.name?.charAt(0) || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-white">{method.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">{method.account_holder_name}</p>
        </div>
      </label>
      <CopyableText
        value={method.account_number}
        className="wallet-pay-card__account"
        textClassName="font-mono text-sm tabular-nums text-accent-light"
        copyLabel="Copy account number"
      />
    </div>
  );
}

function WalletTopUpSummary({ amount, selectedMethod, balance, step }) {
  const ready = amountInRange(amount) && selectedMethod;

  return (
    <aside className="checkout-sidebar wallet-topup-summary">
      <div className="checkout-summary-card wallet-topup-summary__card">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Transfer summary
        </h2>

        {ready ? (
          <dl className="wallet-topup-summary__rows mt-4">
            <div className="wallet-topup-summary__row">
              <dt>Amount</dt>
              <dd className="text-lg font-bold text-accent-light">{formatMmk(amount)}</dd>
            </div>
            <div className="wallet-topup-summary__row">
              <dt>Method</dt>
              <dd>{selectedMethod.name}</dd>
            </div>
            <div className="wallet-topup-summary__row wallet-topup-summary__row--account">
              <dt>Send to</dt>
              <dd>
                <CopyableText
                  value={selectedMethod.account_number}
                  className="w-full"
                  textClassName="font-mono text-sm font-semibold tabular-nums text-accent-light"
                  copyLabel="Copy transfer number"
                />
              </dd>
            </div>
          </dl>
        ) : (
          <p className="wallet-topup-summary__empty mt-3 rounded-xl border border-dashed border-surface-border/80 bg-surface-raised/40 px-4 py-5 text-sm text-slate-500">
            Choose an amount and payment method to see transfer details.
          </p>
        )}

        <div className="wallet-topup-summary__balance mt-4 border-t border-surface-border/80 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Wallet balance
          </p>
          <p className="mt-1 text-xl font-bold text-white">{formatMmk(balance)}</p>
        </div>
      </div>

      <div className="checkout-summary-card wallet-topup-summary__tips">
        <h3 className="text-sm font-bold text-white">
          {step === 1 ? "Before you transfer" : "After you submit"}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {step === 1 ? (
            <>
              <li>Transfer the exact amount shown above.</li>
              <li>Use the account number from your chosen method.</li>
              <li>Take a screenshot of the payment confirmation.</li>
            </>
          ) : (
            <>
              <li>Upload a clear screenshot of the payment.</li>
              <li>
                Status stays <span className="text-accent-light">pending</span> until admin approves.
              </li>
            </>
          )}
        </ul>
      </div>

      <p className="text-center text-sm lg:text-left">
        <Link to={WALLET_HISTORY_PATH} className="text-accent-light hover:underline">
          {WALLET_HISTORY_LABEL}
        </Link>
        {" · "}
        <Link to="/games" className="text-slate-400 hover:text-white">
          Browse games
        </Link>
      </p>
    </aside>
  );
}

function WalletTopUpContent() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { balance, refresh: refreshWallet } = useWallet();
  const [step, setStep] = useState(1);
  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  const [selection, setSelection] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const customInputId = useId();
  const customInputRef = useRef(null);
  const isCustom = selection === AMOUNT_CUSTOM;

  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchPaymentMethods()
      .then(setMethods)
      .catch(() => toast.error("Could not load payment methods."))
      .finally(() => setMethodsLoading(false));
  }, []);

  useEffect(() => {
    if (!proofFile) {
      setProofPreview("");
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const amount = useMemo(() => {
    if (isCustom) return parseMmkInput(customAmount);
    return typeof selection === "number" ? selection : null;
  }, [isCustom, customAmount, selection]);

  const customHint = useMemo(() => {
    if (!isCustom) return null;
    if (amount == null) {
      return `Enter between ${formatMmk(TOPUP_MIN)} and ${formatMmk(TOPUP_MAX)}.`;
    }
    if (amount < TOPUP_MIN) {
      return `Minimum top-up is ${formatMmk(TOPUP_MIN)}.`;
    }
    if (amount > TOPUP_MAX) {
      return `Maximum top-up is ${formatMmk(TOPUP_MAX)}.`;
    }
    return null;
  }, [isCustom, amount]);

  const selectCustom = () => {
    setSelection(AMOUNT_CUSTOM);
    requestAnimationFrame(() => customInputRef.current?.focus());
  };

  const selectedMethod = methods.find((m) => m.id === paymentMethodId);

  const validateAmount = () => {
    if (amount == null || amount < TOPUP_MIN || amount > TOPUP_MAX) {
      toast.error(
        `Enter an amount between ${formatMmk(TOPUP_MIN)} and ${formatMmk(TOPUP_MAX)}.`
      );
      return false;
    }
    return true;
  };

  const goStep2 = () => {
    if (!validateAmount()) return;
    if (!paymentMethodId) {
      toast.error("Choose a payment method.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAmount()) return;
    if (!proofFile) {
      toast.error("Upload your payment screenshot.");
      return;
    }

    setSubmitting(true);
    try {
      await submitWalletTopUp({
        amount,
        paymentMethodId,
        proofFile,
      });
      await Promise.all([refreshWallet(), refreshUser()]);
      setSubmitted(true);
      toast.success("Top-up submitted. We will review it shortly.");
    } catch (err) {
      toast.error(err.message || "Could not submit top-up.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="site-container wallet-topup-page wallet-topup-page--success py-8 sm:py-10 lg:py-14">
        <div className="wallet-topup-success">
          <div className="wallet-topup-success__panel">
            <span className="status-card__icon status-card__icon--success mx-auto text-2xl lg:mx-0">
              ✓
            </span>
            <h1 className="section-heading mt-4">Top-up submitted</h1>
            <p className="section-sub mt-2 lg:max-w-xl">
              Your request is <strong className="text-accent-light">pending</strong>. Once approved,
              {formatMmk(amount)} will be added to your wallet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Current balance: <span className="text-accent-light">{formatMmk(balance)}</span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">
              <Link to="/wallet/history" className="btn-secondary">
                View history
              </Link>
              <Link to="/games" className="btn-primary">
                Top up a game
              </Link>
            </div>
          </div>
          <aside className="wallet-topup-success__aside">
            <div className="glass-panel p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                What happens next
              </h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
                <li>Our team reviews your payment proof.</li>
                <li>Approved top-ups are credited to your wallet.</li>
                <li>Use your balance for faster game checkout.</li>
              </ol>
            </div>
            <div className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-white">Need help?</h2>
              <p className="mt-2 text-sm text-slate-400">
                Check top-up history for status updates or contact support if approval takes longer
                than expected.
              </p>
              <Link to="/help" className="btn-secondary mt-4 inline-flex w-full justify-center">
                Help & support
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container wallet-topup-page py-6 sm:py-8 lg:py-10">
      <header className="wallet-topup-page__header">
        <div className="wallet-topup-page__intro">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">
              Wallet
            </p>
            <h1 className="section-heading mt-1">{WALLET_ADD_LABEL_LONG}</h1>
            <p className="section-sub mt-1 max-w-2xl text-sm sm:text-base">
              Transfer to our account, then submit proof. Balance is used for instant game top-ups.
            </p>
          </div>
          <div className="wallet-balance-banner wallet-balance-banner--inline shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available balance
            </span>
            <p className="text-xl font-bold text-accent-light sm:text-2xl">{formatMmk(balance)}</p>
          </div>
        </div>

        <ol className="checkout-steps wallet-topup-page__steps" aria-label="Wallet top-up steps">
          <li
            className={`checkout-step ${step === 1 ? "checkout-step--active" : ""} ${
              step > 1 ? "checkout-step--done" : ""
            }`}
          >
            <span className="checkout-step__num">{step > 1 ? "✓" : "1"}</span>
            <span className="checkout-step__label">Amount & payment</span>
          </li>
          <li className={`checkout-step ${step === 2 ? "checkout-step--active" : ""}`}>
            <span className="checkout-step__num">2</span>
            <span className="checkout-step__label">Proof</span>
          </li>
        </ol>
      </header>

      <div className="checkout-grid wallet-topup-page__grid">
        {step === 1 ? (
          <div className="glass-panel wallet-topup-main p-5 sm:p-6 lg:p-7">
            <section className="wallet-topup-section">
              <h2 className="wallet-topup-section__title">Choose amount (MMK)</h2>
              <p className="wallet-topup-section__sub">
                Tap a quick amount or enter your own below.
              </p>
              <div
                className="wallet-amount-grid mt-4"
                role="group"
                aria-label="Top-up amount"
              >
                {TOPUP_PRESETS.map((v) => (
                  <AmountChip
                    key={v}
                    value={v}
                    selected={!isCustom && selection === v}
                    onSelect={(val) => setSelection(val)}
                  />
                ))}
                <button
                  type="button"
                  className={`wallet-amount-chip wallet-amount-chip--custom ${
                    isCustom ? "wallet-amount-chip--active" : ""
                  }`}
                  aria-pressed={isCustom}
                  onClick={selectCustom}
                >
                  <span>Other amount</span>
                  <span className="text-xs font-normal text-slate-500">Type any value</span>
                </button>

                {isCustom ? (
                  <div className="wallet-amount-custom-panel wallet-amount-custom-panel--active">
                    <label htmlFor={customInputId} className="field-label">
                      Enter amount
                    </label>
                    <div className="wallet-amount-input-wrap">
                      <input
                        ref={customInputRef}
                        id={customInputId}
                        type="text"
                        inputMode="numeric"
                        className="input-field w-full"
                        placeholder={formatNumber(TOPUP_MIN)}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(formatMmkInput(e.target.value))}
                        aria-invalid={Boolean(customHint)}
                        aria-describedby={customHint ? `${customInputId}-hint` : undefined}
                        autoComplete="off"
                      />
                      <span className="wallet-amount-input-suffix" aria-hidden>
                        MMK
                      </span>
                    </div>
                    <p
                      id={`${customInputId}-hint`}
                      className={`wallet-amount-hint ${
                        customHint ? "wallet-amount-hint--error" : ""
                      }`}
                    >
                      {customHint ||
                        `Between ${formatMmk(TOPUP_MIN)} and ${formatMmk(TOPUP_MAX)}.`}
                    </p>
                    {amountInRange(amount) ? (
                      <p className="wallet-amount-preview">
                        You will transfer {formatMmk(amount)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="wallet-topup-section mt-8">
              <h2 className="wallet-topup-section__title">Payment method</h2>
              {methodsLoading ? (
                <p className="wallet-topup-section__sub mt-3 text-slate-500">
                  Loading methods…
                </p>
              ) : methods.length === 0 ? (
                <p className="mt-3 text-sm text-accent-light">
                  No payment methods available. Please contact support.
                </p>
              ) : (
                <div className="wallet-pay-methods" role="radiogroup" aria-label="Payment method">
                  {methods.map((m) => (
                    <PaymentMethodCard
                      key={m.id}
                      method={m}
                      selected={paymentMethodId === m.id}
                      onSelect={setPaymentMethodId}
                    />
                  ))}
                </div>
              )}
            </section>

            {selectedMethod && amountInRange(amount) ? (
              <div className="form-banner wallet-topup-transfer-banner mt-6 lg:hidden">
                <p>
                  Transfer <strong className="text-white">{formatMmk(amount)}</strong> to{" "}
                  <strong className="text-white">{selectedMethod.name}</strong>:
                </p>
                <div className="wallet-transfer-account">
                  <CopyableText
                    value={selectedMethod.account_number}
                    textClassName="font-mono text-base font-semibold tabular-nums text-accent-light"
                    copyLabel="Copy transfer number"
                  />
                </div>
              </div>
            ) : null}

            <div className="wallet-topup-actions mt-6 sm:mt-8">
              <button type="button" className="btn-primary w-full py-3 sm:w-auto sm:min-w-[220px]" onClick={goStep2}>
                Continue
              </button>
            </div>
          </div>
        ) : (
          <form className="glass-panel wallet-topup-main p-5 sm:p-6 lg:p-7" onSubmit={handleSubmit}>
            <button
              type="button"
              className="btn-ghost -ml-2 mb-4 text-sm"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>

            <div className="wallet-proof-layout">
              <div className="wallet-proof-layout__fields">
                <div className="rounded-xl border border-surface-border bg-surface-raised/50 p-4 text-sm lg:hidden">
                  <p>
                    Amount:{" "}
                    <span className="font-semibold text-white">{formatMmk(amount)}</span>
                  </p>
                  {selectedMethod ? (
                    <div className="mt-2 text-slate-400">
                      <p>Via {selectedMethod.name}</p>
                      <CopyableText
                        value={selectedMethod.account_number}
                        className="mt-1"
                        textClassName="font-mono text-sm tabular-nums text-accent-light"
                        copyLabel="Copy account number"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  <span className="field-label" id="proof-upload-label">
                    Payment screenshot
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label
                      className="btn-secondary cursor-pointer text-sm"
                      aria-labelledby="proof-upload-label"
                    >
                      {proofFile ? "Change screenshot" : "Choose screenshot"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {proofFile ? (
                      <span className="min-w-0 truncate text-xs text-slate-500">
                        {proofFile.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">PNG or JPG from your payment app</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-6 w-full py-3 lg:hidden"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
              </div>

              <div className="wallet-proof-layout__preview">
                {proofPreview ? (
                  <div className="wallet-proof-preview">
                    <img src={proofPreview} alt="Payment screenshot preview" />
                  </div>
                ) : (
                  <div className="wallet-proof-preview wallet-proof-preview--empty">
                    <p className="text-sm text-slate-500">Screenshot preview will appear here</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary mt-4 hidden w-full py-3 lg:inline-flex"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
                <p className="mt-3 hidden text-center text-xs text-slate-500 lg:block">
                  Status will show as <span className="text-accent-light">pending</span> until admin
                  approves.
                </p>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500 lg:hidden">
              Status will show as <span className="text-accent-light">pending</span> until admin
              approves.
            </p>
          </form>
        )}

        <WalletTopUpSummary
          amount={amount}
          selectedMethod={selectedMethod}
          balance={balance}
          step={step}
        />
      </div>

      <p className="wallet-topup-page__footer-links mt-6 text-center text-sm lg:hidden">
        <Link to={WALLET_HISTORY_PATH} className="text-accent-light hover:underline">
          {WALLET_HISTORY_LABEL}
        </Link>
        {" · "}
        <button
          type="button"
          className="text-slate-400 hover:text-white"
          onClick={() => navigate("/games")}
        >
          Browse games
        </button>
      </p>
    </div>
  );
}

export default function WalletTopUpPage() {
  return (
    <RequireAuth>
      <WalletTopUpContent />
    </RequireAuth>
  );
}
