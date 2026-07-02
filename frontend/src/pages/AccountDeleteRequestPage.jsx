import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAccountDeleteRequest,
  submitAccountDeleteRequest,
} from "../api/auth";
import { HELP_PATH, PRIVACY_PATH, PROFILE_PATH } from "../config/siteNav";
import RequireAuth from "../components/RequireAuth";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { BRAND_DOMAIN } from "../constants/brand";
import { toast } from "../utils/toast";

const REASONS = [
  { value: "", label: "Select a reason (optional)" },
  { value: "no_longer_use", label: "I no longer use this service" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "duplicate", label: "Duplicate account" },
  { value: "other", label: "Other" },
];

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function AccountDeleteContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAccountDeleteRequest();
        if (!active) return;
        if (data.pending && data.request) {
          setPending(data.request);
          setSubmitted(true);
        }
      } catch {
        if (active) toast.error("Could not load your request status.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!confirm) {
      toast.warning("Please confirm that you want to delete your account.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await submitAccountDeleteRequest({
        password,
        reason: reason.trim(),
        message: message.trim(),
        confirm: true,
      });
      setPending(data.request);
      setSubmitted(true);
      setPassword("");
      toast.success(data.detail || "Request submitted.");
    } catch (err) {
      toast.error(err.message || "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-split">
      <div className="page-split__main">
        <Link to={PROFILE_PATH} className="text-sm text-slate-500 transition-colors hover:text-accent-light">
          ← Back to profile
        </Link>

        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-accent-light/90">
          Account
        </p>
        <h1 className="section-heading mt-2">Delete account request</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 lg:text-base">
          Submit a request to permanently delete your {BRAND_DOMAIN} account. Our team will verify
          your identity and process eligible requests. Wallet balance, order history, and profile
          data will be removed according to our{" "}
          <Link to={PRIVACY_PATH} className="text-accent-light hover:text-accent">
            privacy policy
          </Link>
          .
        </p>

        <div className="glass-panel mt-8 hidden p-6 lg:block">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Before you submit
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
            <li>Deletion is permanent once approved.</li>
            <li>Unused wallet balance may be forfeited.</li>
            <li>We may email you to confirm your identity.</li>
            <li>You can contact support to cancel a pending request.</li>
          </ul>
        </div>
      </div>

      <div className="page-split__aside">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : submitted && pending ? (
          <div className="glass-panel border-accent/20 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white">Request received</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Your account deletion request is <span className="text-accent-light">pending review</span>.
            We will email <span className="text-white">{user?.email}</span> when it is processed.
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-surface-border pb-3">
              <dt className="text-slate-500">Submitted</dt>
              <dd className="text-right text-slate-300">{formatDate(pending.created_at)}</dd>
            </div>
            {pending.reason ? (
              <div className="flex justify-between gap-4 border-b border-surface-border pb-3">
                <dt className="text-slate-500">Reason</dt>
                <dd className="text-right text-slate-300">
                  {REASONS.find((r) => r.value === pending.reason)?.label || pending.reason}
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-6 text-sm text-slate-500">
            Changed your mind? Contact{" "}
            <a href={`mailto:support@${BRAND_DOMAIN}`} className="text-accent-light hover:text-accent">
              support@{BRAND_DOMAIN}
            </a>{" "}
            before the request is approved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={PROFILE_PATH} className="btn-secondary inline-flex">
              Back to profile
            </Link>
            <Link to={HELP_PATH} className="btn-secondary inline-flex">
              Help & support
            </Link>
          </div>
        </div>
        ) : (
          <form onSubmit={onSubmit} className="glass-panel p-6 sm:p-8">
          <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent-light/90">
            This action cannot be undone once your account is deleted. Any remaining wallet balance
            may be forfeited unless required by law.
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Registered email</span>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="input-field mt-2 w-full opacity-70"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">Reason</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field mt-2 w-full"
              >
                {REASONS.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Additional message <span className="text-slate-500">(optional)</span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell us anything we should know before processing your request."
                className="input-field mt-2 w-full min-h-[6rem] resize-y"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">Confirm with password</span>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your account password"
                className="input-field mt-2 w-full"
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-surface-border bg-surface-raised accent-accent"
              />
              <span className="text-sm leading-relaxed text-slate-400">
                I understand that deleting my account is permanent and I want to proceed with this
                request.
              </span>
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 !bg-slate-800 hover:!bg-slate-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit deletion request"}
            </button>
            <Link to={PROFILE_PATH} className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default function AccountDeleteRequestPage() {
  return (
    <RequireAuth>
      <div className="site-container py-10 sm:py-14">
        <AccountDeleteContent />
      </div>
    </RequireAuth>
  );
}
