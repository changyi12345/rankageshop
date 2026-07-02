import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword, validateResetToken } from "../api/auth";
import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { IconLock } from "../components/auth/AuthIcons";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState("loading");
  const [tokenMessage, setTokenMessage] = useState("");
  const [form, setForm] = useState({ password: "", password_confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenMessage("Missing reset token. Use the link from your email.");
      return;
    }

    let cancelled = false;
    validateResetToken(token)
      .then(() => {
        if (!cancelled) setTokenStatus("valid");
      })
      .catch((err) => {
        if (!cancelled) {
          setTokenStatus("invalid");
          setTokenMessage(err.message || "This reset link is invalid or expired.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await resetPassword({ token, ...form });
      setSuccess(true);
      setTokenMessage(res.detail || "Password updated.");
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenStatus === "loading") {
    return (
      <AuthCard badge="Security" title="Reset password" subtitle="Checking your secure link…">
        <div className="auth-form__spinner-wrap">
          <span className="auth-loading__spinner" aria-hidden />
        </div>
      </AuthCard>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <AuthCard badge="Link expired" title="Reset link invalid" subtitle={tokenMessage}>
        <div className="auth-form__actions">
          <Link to="/forgot-password" className="btn-auth w-full text-center">
            Request new link
          </Link>
          <Link to="/login" className="btn-secondary w-full text-center">
            Sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard badge="All set" title="Password updated" subtitle={tokenMessage}>
        <Link to="/login?reset=1" className="btn-auth w-full text-center">
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      badge="New password"
      title="Choose a new password"
      subtitle="Pick a strong password to protect your wallet and orders."
      footer={
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="auth-form" noValidate>
        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}

        <AuthField
          id="password"
          name="password"
          type="password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          icon={<IconLock className="h-[18px] w-[18px]" />}
          value={form.password}
          onChange={onChange}
          hint="At least 8 characters."
        />

        <AuthField
          id="password_confirm"
          name="password_confirm"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repeat password"
          icon={<IconLock className="h-[18px] w-[18px]" />}
          value={form.password_confirm}
          onChange={onChange}
        />

        <button type="submit" className="btn-auth w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}
