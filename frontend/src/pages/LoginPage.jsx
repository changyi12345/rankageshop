import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/auth/AuthCard";
import { AuthDivider } from "../components/auth/AuthDivider";
import AuthField from "../components/auth/AuthField";
import AuthLoading from "../components/auth/AuthLoading";
import GoogleSignIn from "../components/auth/GoogleSignIn";
import { IconLock, IconMail } from "../components/auth/AuthIcons";

function isSafeReturnPath(path) {
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export default function LoginPage() {
  const { login, googleLogin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("next") || "/";
  const verified = searchParams.get("verified") === "1";
  const passwordReset = searchParams.get("reset") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const next = isSafeReturnPath(redirectTo) ? redirectTo : "/";
      navigate(next, { replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const onGoogleCredential = useCallback(
    async (idToken) => {
      setError("");
      setResendMsg("");
      setShowResend(false);
      setLoading(true);
      try {
        await googleLogin(idToken);
        const next = isSafeReturnPath(redirectTo) ? redirectTo : "/";
        navigate(next, { replace: true });
      } catch (err) {
        setError(err.message || "Google sign-in failed.");
      } finally {
        setLoading(false);
      }
    },
    [googleLogin, navigate, redirectTo],
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendMsg("");
    setShowResend(false);
    setLoading(true);
    try {
      await login(username, password);
      const next = isSafeReturnPath(redirectTo) ? redirectTo : "/";
      navigate(next, { replace: true });
    } catch (err) {
      const msg = err.message || "Sign in failed.";
      setError(msg);
      if (err.code === "email_not_verified" || /activate your account/i.test(msg)) setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!username.trim()) {
      setResendMsg("Enter your username or email above, then try again.");
      return;
    }
    setResending(true);
    setResendMsg("");
    try {
      const res = await resendVerification(username.trim());
      setResendMsg(res.detail || "If an account exists, we sent a new link.");
    } catch (err) {
      setResendMsg(err.message || "Could not resend email.");
    } finally {
      setResending(false);
    }
  };

  if (authLoading || user) {
    return <AuthLoading />;
  }

  return (
    <AuthCard
      badge="Sign in"
      title="Welcome back"
      subtitle="Sign in to top up from your wallet, track top-ups, and checkout faster."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="auth-link">
            Create free account
          </Link>
        </>
      }
    >
      {verified ? (
        <p className="form-banner form-banner--warning auth-form-banner">
          Account activated — you can sign in and start topping up.
        </p>
      ) : null}
      {passwordReset ? (
        <p className="form-banner form-banner--warning auth-form-banner">
          Password updated. Sign in with your new password.
        </p>
      ) : null}

      <GoogleSignIn onCredential={onGoogleCredential} disabled={loading} />
      <AuthDivider />

      <form onSubmit={onSubmit} className="auth-form" noValidate>
        {error ? (
          <p className="auth-alert" role="alert">
            {error}
          </p>
        ) : null}

        <AuthField
          id="username"
          name="username"
          type="text"
          label="Email or Username"
          autoComplete="username"
          required
          placeholder="you@email.com or your_username"
          icon={<IconMail className="h-[18px] w-[18px]" />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <AuthField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          icon={<IconLock className="h-[18px] w-[18px]" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelExtra={
            <Link to="/forgot-password" className="auth-link auth-link--sm">
              Forgot password?
            </Link>
          }
        />

        <button type="submit" className="btn-auth w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {showResend ? (
        <div className="auth-form__extra">
          <button
            type="button"
            className="btn-secondary w-full text-sm"
            disabled={resending}
            onClick={onResend}
          >
            {resending ? "Sending…" : "Resend activation link"}
          </button>
          {resendMsg ? <p className="auth-field__hint text-center">{resendMsg}</p> : null}
        </div>
      ) : null}
    </AuthCard>
  );
}
