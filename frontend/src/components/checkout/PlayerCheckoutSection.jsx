import { useEffect, useMemo, useState } from "react";
import {
  checkStorePlayer,
  createStoreOrder,
  fetchStoreOrderStatus,
} from "../../api/store";
import { WALLET_ADD_LABEL_FIRST } from "../../config/siteNav";
import { LoginPromptCard } from "../RequireAuth";
import Select from "../ui/Select";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useWallet } from "../../hooks/useWallet";
import { formatPrice } from "../../utils/format";
import { PackageSummaryRow } from "../packages/PackageCard";
import { getErrorMessage, toast } from "../../utils/toast";
import {
  normalizeOrderStatus,
  parseOrderResult,
  parseVerifyResult,
} from "../../utils/playerCheckout";

const FIELD_LABELS = {
  userid: "Game ID",
  serverid: "Server",
  charname: "Character name",
};

function flattenServers(servers) {
  if (!servers) return [];
  if (Array.isArray(servers)) {
    return servers.map((s) => ({
      id: String(s.id ?? s.server_id ?? s),
      label: s.name ?? s.label ?? String(s),
    }));
  }
  const opts = [];
  for (const [group, list] of Object.entries(servers)) {
    if (!Array.isArray(list)) continue;
    list.forEach((s) => {
      if (typeof s === "string" || typeof s === "number") {
        opts.push({ id: String(s), label: String(s), group });
        return;
      }
      opts.push({
        id: String(s.id ?? s.server_id ?? s.value ?? s),
        label: s.name ?? s.label ?? String(s.id ?? s),
        group,
      });
    });
  }
  return opts;
}

function StepPill({ step, label, active, done }) {
  return (
    <li
      className={`checkout-step ${active ? "checkout-step--active" : ""} ${
        done ? "checkout-step--done" : ""
      }`}
    >
      <span className="checkout-step__num">{done ? "✓" : step}</span>
      <span className="checkout-step__label">{label}</span>
    </li>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      {message}
    </p>
  );
}

function StatusIcon({ variant }) {
  if (variant === "loading") {
    return (
      <span
        className="status-card__icon status-card__icon--loading"
        aria-hidden
      >
        <span className="status-spinner" />
      </span>
    );
  }
  if (variant === "success") {
    return (
      <span
        className="status-card__icon status-card__icon--success"
        aria-hidden
      >
        ✓
      </span>
    );
  }
  if (variant === "error") {
    return (
      <span className="status-card__icon status-card__icon--error" aria-hidden>
        !
      </span>
    );
  }
  return (
    <span className="status-card__icon status-card__icon--idle" aria-hidden>
      ○
    </span>
  );
}

function PlayerAccountPreview({
  playerId,
  playerName,
  serverLabel,
  charname,
  verified,
  verifyState,
  needsServer,
  needsCharname,
}) {
  const hasPlayerId = Boolean(playerId);
  const isEmpty = !hasPlayerId && verifyState.phase === "idle";
  const isLoading = verifyState.phase === "loading";
  const initial = (playerName || playerId || "?").charAt(0).toUpperCase();

  return (
    <div
      className={[
        "account-preview",
        isEmpty && "account-preview--empty",
        verified && "account-preview--verified",
        isLoading && "account-preview--loading",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <div className="account-preview__avatar" aria-hidden>
        {initial}
      </div>
      <div className="account-preview__body min-w-0 flex-1">
        <p className="account-preview__label">
          {isLoading
            ? "Checking account…"
            : verified
              ? "Verified account"
              : "Account preview"}
        </p>
        <p className="account-preview__name">
          {playerName || (isEmpty ? "Waiting for Game ID" : "—")}
        </p>
        <dl className="account-preview__meta">
          <div className="account-preview__row">
            <dt>Game ID</dt>
            <dd className="font-mono">{playerId || "—"}</dd>
          </div>
          {needsServer ? (
            <div className="account-preview__row">
              <dt>Server</dt>
              <dd>{serverLabel || "—"}</dd>
            </div>
          ) : null}
          {needsCharname ? (
            <div className="account-preview__row">
              <dt>Character</dt>
              <dd>{charname || "—"}</dd>
            </div>
          ) : null}
        </dl>
        {verifyState.phase === "error" ? (
          <p className="account-preview__error" role="alert">
            {verifyState.message}
          </p>
        ) : null}
        {verifyState.phase === "success" && verifyState.message && !playerName ? (
          <p className="account-preview__hint">{verifyState.message}</p>
        ) : null}
        {isEmpty ? (
          <p className="account-preview__placeholder">
            Enter your Game ID above, then tap Verify ID to load account
            details.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function OrderSummaryCard({ gameName, gameCode, selectedPackage }) {
  if (!selectedPackage) {
    return (
      <div className="checkout-summary-card checkout-summary-card--empty">
        <p className="text-sm font-medium text-slate-400">
          No package selected
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Choose a package above to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-summary-card">
      <p className="text-[10px] font-bold uppercase tracking-widest text-accent-light">
        Order summary
      </p>
      <p className="mt-2 text-sm text-slate-400">{gameName}</p>
      <PackageSummaryRow
        pkg={selectedPackage}
        gameCode={gameCode}
        gameName={gameName}
        className="mt-4 border-t border-surface-border pt-4"
      />
    </div>
  );
}

function OrderStatusCard({ state }) {
  if (!state || state.phase === "idle") return null;

  if (state.phase === "loading") {
    return (
      <div className="status-card status-card--pending animate-fade-in">
        <StatusIcon variant="loading" />
        <div>
          <p className="status-card__title">Placing order…</p>
          <p className="status-card__text">
            Please wait, do not close this page.
          </p>
        </div>
      </div>
    );
  }

  if (state.phase === "success") {
    const tone = normalizeOrderStatus(state.status);
    return (
      <div className="order-receipt-card animate-fade-in">
        <div className="order-receipt-card__header">
          <StatusIcon variant="success" />
          <div>
            <p className="order-receipt-card__title">Order submitted</p>
            <p className="order-receipt-card__subtitle">{state.message}</p>
          </div>
        </div>
        <dl className="order-receipt-card__meta">
          {state.orderId ? (
            <div>
              <dt>Order ID</dt>
              <dd className="font-mono">#{state.orderId}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`order-badge order-badge--${tone}`}>
                {state.status}
              </span>
            </dd>
          </div>
          {state.catalogue ? (
            <div>
              <dt>Package</dt>
              <dd>{state.catalogue}</dd>
            </div>
          ) : null}
        </dl>
        <p className="order-receipt-card__hint">
          Delivery is usually instant. Keep your order ID for support.
        </p>
      </div>
    );
  }

  return (
    <div className="status-card status-card--error animate-fade-in">
      <StatusIcon variant="error" />
      <div>
        <p className="status-card__title">Order failed</p>
        <p className="status-card__text">{state.message}</p>
      </div>
    </div>
  );
}

export default function PlayerCheckoutSection({
  gameCode,
  gameName,
  detail,
  selectedPackage,
  activeRegion,
}) {
  const [playerId, setPlayerId] = useState("");
  const [serverId, setServerId] = useState("");
  const [charname, setCharname] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [verifyState, setVerifyState] = useState({ phase: "idle" });
  const [orderState, setOrderState] = useState({ phase: "idle" });
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { refreshAll: refreshNotifications } = useNotifications();
  const { balance, refresh: refreshWallet } = useWallet();
  const [checkLoading, setCheckLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const serverOptions = useMemo(
    () => flattenServers(detail?.servers),
    [detail?.servers],
  );

  const serverSelectGroups = useMemo(() => {
    const byGroup = new Map();
    for (const opt of serverOptions) {
      const key = opt.group || "";
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push({ value: opt.id, label: opt.label });
    }
    return Array.from(byGroup.entries()).map(([label, options]) => ({
      label: label || undefined,
      options,
    }));
  }, [serverOptions]);

  const needsServer = (detail?.fields || []).includes("serverid");
  const needsCharname = (detail?.fields || []).includes("charname");
  const showPlayerId =
    (detail?.fields || []).length === 0 ||
    (detail?.fields || []).includes("userid");

  const serverLabel = useMemo(() => {
    if (!serverId) return "";
    const match = serverOptions.find((o) => o.id === serverId);
    return match
      ? match.group
        ? `${match.group} — ${match.label}`
        : match.label
      : serverId;
  }, [serverId, serverOptions]);

  const verifyOk = verifyState.phase === "success";
  const hasPackage = Boolean(selectedPackage);
  const hasPlayerId = Boolean(playerId.trim());

  useEffect(() => {
    setVerifyState({ phase: "idle" });
    setFieldErrors((prev) => ({ ...prev, playerId: undefined }));
  }, [playerId, serverId, charname, activeRegion]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCheckPlayer = async () => {
    setFieldErrors({});
    if (!playerId.trim()) {
      setFieldErrors({ playerId: "Enter your in-game ID." });
      return;
    }

    setCheckLoading(true);
    setVerifyState({ phase: "loading" });
    try {
      const result = await checkStorePlayer(gameCode, {
        player_id: playerId.trim(),
        server_id: serverId,
        charname: charname.trim(),
        region: activeRegion,
      });
      const parsed = parseVerifyResult(result);
      if (parsed.ok) {
        setVerifyState({
          phase: "success",
          message: parsed.name
            ? `Account found: ${parsed.name}`
            : parsed.message,
          name: parsed.name,
        });
      } else {
        setVerifyState({ phase: "error", message: parsed.message });
      }
    } catch (err) {
      setVerifyState({
        phase: "error",
        message: getErrorMessage(err, "Could not verify ID."),
      });
    } finally {
      setCheckLoading(false);
    }
  };

  const packagePrice =
    selectedPackage?.amount != null ? Number(selectedPackage.amount) : null;
  const insufficient = packagePrice != null && user && balance < packagePrice;

  const handleOrder = async () => {
    if (!user) {
      toast.error("Sign in to pay from your wallet.");
      return;
    }

    const errors = {};
    if (!selectedPackage) errors.package = "Select a package first.";
    if (!playerId.trim()) errors.playerId = "Game ID is required.";
    if (needsServer && !serverId) errors.serverId = "Select or enter a server.";
    if (!verifyOk) {
      toast.warning("Verify your game ID before paying.");
      return;
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    if (packagePrice != null && balance < packagePrice) {
      toast.error(`Insufficient wallet balance. ${WALLET_ADD_LABEL_FIRST}.`);
      return;
    }

    setFieldErrors({});
    setOrderLoading(true);
    setOrderState({ phase: "loading" });
    try {
      const result = await createStoreOrder(gameCode, {
        catalogue_name: selectedPackage.name,
        unit_price: selectedPackage.amount,
        player_id: playerId.trim(),
        server_id: serverId,
        charname: charname.trim(),
        player_name: verifyState.name,
        region: activeRegion,
      });
      let statusResult = result;
      const orderId = result?.id ?? result?.order_id ?? result?.primaryOrderId;
      if (orderId) {
        try {
          statusResult = await fetchStoreOrderStatus(gameCode, orderId, activeRegion);
        } catch {
          /* keep create response */
        }
      }
      const parsed = parseOrderResult(
        statusResult?.order ? statusResult : result,
      );
      setOrderState({
        phase: "success",
        message: parsed.message,
        orderId: parsed.orderId,
        status: parsed.status,
        catalogue: parsed.catalogue || selectedPackage.name,
      });
      await Promise.all([refreshWallet(), refreshUser(), refreshNotifications()]);
    } catch (err) {
      const msg = getErrorMessage(err, "Order failed. Please try again.");
      setOrderState({
        phase: "error",
        message: msg,
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const inputErrorClass = (key) =>
    fieldErrors[key] ? "input-field input-field--error" : "input-field";

  if (!authLoading && !user) {
    return (
      <section className="checkout-section mt-12">
        <LoginPromptCard message="Sign in to top up with your wallet balance." />
      </section>
    );
  }

  return (
    <section className="checkout-section mt-12">
      <div className="checkout-section__wallet">
        <ol className="checkout-steps" aria-label="Checkout steps">
          <StepPill
            step={1}
            label="Package"
            active={!hasPackage}
            done={hasPackage}
          />
          <StepPill
            step={2}
            label="Game ID"
            active={hasPackage && !hasPlayerId}
            done={hasPlayerId}
          />
          <StepPill
            step={3}
            label="Verify"
            active={hasPlayerId && !verifyOk}
            done={verifyOk}
          />
          <StepPill
            step={4}
            label="Pay"
            active={verifyOk}
            done={orderState.phase === "success"}
          />
        </ol>
      </div>

      <div className="checkout-grid">
        <div className="checkout-form-panel glass-panel p-6 sm:p-8">
          <h3 className="text-base font-bold text-white">Account details</h3>
          <p className="mt-1 text-sm text-slate-400">
            Use the same ID you log in with inside the game.
          </p>

          {fieldErrors.package ? (
            <div className="form-banner form-banner--warning mt-4" role="alert">
              {fieldErrors.package}
            </div>
          ) : null}

          {showPlayerId ? (
            <label className="mt-6 block">
              <span className="field-label">{FIELD_LABELS.userid}</span>
              <input
                type="text"
                className={`${inputErrorClass("playerId")} mt-2 w-full`}
                value={playerId}
                onChange={(e) => {
                  setPlayerId(e.target.value);
                  clearFieldError("playerId");
                }}
                placeholder="e.g. 5123456789"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.playerId)}
              />
              <FieldError message={fieldErrors.playerId} />
            </label>
          ) : null}

          {needsServer && serverOptions.length > 0 ? (
            <div className="mt-4 block">
              <span className="field-label" id="checkout-server-label">
                {FIELD_LABELS.serverid}
              </span>
              <div className="mt-2">
                <Select
                  value={serverId}
                  onValueChange={(val) => {
                    setServerId(val);
                    clearFieldError("serverId");
                  }}
                  groups={serverSelectGroups}
                  placeholder="Select server"
                  invalid={Boolean(fieldErrors.serverId)}
                  aria-label={FIELD_LABELS.serverid}
                />
              </div>
              <FieldError message={fieldErrors.serverId} />
            </div>
          ) : needsServer ? (
            <label className="mt-4 block">
              <span className="field-label">{FIELD_LABELS.serverid}</span>
              <input
                type="text"
                className={`${inputErrorClass("serverId")} mt-2 w-full`}
                value={serverId}
                onChange={(e) => {
                  setServerId(e.target.value);
                  clearFieldError("serverId");
                }}
                placeholder="Server ID"
                aria-invalid={Boolean(fieldErrors.serverId)}
              />
              <FieldError message={fieldErrors.serverId} />
            </label>
          ) : null}

          {needsCharname ? (
            <label className="mt-4 block">
              <span className="field-label">{FIELD_LABELS.charname}</span>
              <input
                type="text"
                className="input-field mt-2 w-full"
                value={charname}
                onChange={(e) => setCharname(e.target.value)}
                placeholder="Character name"
              />
            </label>
          ) : null}

          <PlayerAccountPreview
            playerId={playerId.trim()}
            playerName={verifyState.name}
            serverLabel={serverLabel}
            charname={charname.trim()}
            verified={verifyOk}
            verifyState={verifyState}
            needsServer={needsServer}
            needsCharname={needsCharname}
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-secondary flex-1 py-3"
              onClick={handleCheckPlayer}
              disabled={checkLoading || orderLoading}
            >
              {checkLoading ? "Checking…" : "Verify ID"}
            </button>
            <button
              type="button"
              className="btn-primary flex-1 py-3"
              onClick={handleOrder}
              disabled={
                orderLoading ||
                checkLoading ||
                !selectedPackage ||
                !verifyOk ||
                insufficient
              }
            >
              {orderLoading
                ? "Placing order…"
                : selectedPackage
                  ? `Pay from wallet — ${formatPrice(
                      selectedPackage.amount,
                      selectedPackage.currency,
                    )}`
                  : "Select a package"}
            </button>
          </div>
        </div>

        <aside className="checkout-sidebar">
          <OrderSummaryCard
            gameName={gameName}
            gameCode={gameCode}
            selectedPackage={selectedPackage}
          />

          <OrderStatusCard state={orderState} />
        </aside>
      </div>
    </section>
  );
}
