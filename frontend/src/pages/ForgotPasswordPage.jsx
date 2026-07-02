import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { IconMail } from "../components/auth/AuthIcons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard
        badge="Email sent"
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, we sent a password reset link. Open it and choose a new password.`}
        footer={
          <Link to="/login" className="auth-link">
            Back to sign in
          </Link>
        }
      >
        <p className="form-banner form-banner--warning">
          The link expires in a few hours. Did not get it? Check spam or try again with the same email.
        </p>
        <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setSuccess(false)}>
          Send again
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      badge="Account recovery"
      title="Reset password"
      subtitle="Enter the email on your account. We will send a secure reset link."
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
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          icon={<IconMail className="h-[18px] w-[18px]" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit" className="btn-auth w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
