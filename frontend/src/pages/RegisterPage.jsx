import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PRIVACY_PATH } from "../config/siteNav";
import { useAuth } from "../context/AuthContext";
import AuthCard from "../components/auth/AuthCard";
import { AuthDivider } from "../components/auth/AuthDivider";
import AuthField from "../components/auth/AuthField";
import AuthLoading from "../components/auth/AuthLoading";
import GoogleSignIn from "../components/auth/GoogleSignIn";
import { IconLock, IconMail, IconUser } from "../components/auth/AuthIcons";

export default function RegisterPage() {
  const { register, googleLogin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim() || "";
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

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
      const res = await register(form);
      if (res?.access_token || res?.user) {
        navigate("/", { replace: true });
        return;
      }
      setSuccess(res);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleCredential = useCallback(
    async (idToken) => {
      setError("");
      setLoading(true);
      try {
        await googleLogin(idToken, referralCode || undefined);
        navigate("/", { replace: true });
      } catch (err) {
        setError(err.message || "Google sign-up failed.");
      } finally {
        setLoading(false);
      }
    },
    [googleLogin, navigate, referralCode],
  );

  if (authLoading || user) {
    return <AuthLoading />;
  }

  if (success) {
    const isActivation = success.activation_required;
    return (
      <AuthCard
        badge={isActivation ? "Activation needed" : "Almost there"}
        title={isActivation ? "Activate your account" : "Check your inbox"}
        subtitle={
          isActivation
            ? `This email is already registered but not active. We sent an activation link to ${success.email || form.email}. Activate your account, then sign in.`
            : `We sent a confirmation link to ${success.email || form.email}. Confirm your email, then sign in to start topping up.`
        }
        footer={
          <Link to="/login" className="auth-link">
            Go to sign in
          </Link>
        }
      >
        <p className="form-banner form-banner--warning">
          Did not get the email? Check spam or{" "}
          <Link to="/login" className="auth-link auth-link--inline">
            sign in
          </Link>{" "}
          to resend the activation link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      badge="New account"
      title="Create account"
      subtitle="One account for wallet top-ups, faster checkout, and top-up history."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleSignIn
        onCredential={onGoogleCredential}
        disabled={loading}
        referralCode={referralCode || undefined}
      />
      <AuthDivider label="or register with email" />

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
          label="Username"
          autoComplete="username"
          required
          minLength={2}
          placeholder="Choose a username"
          icon={<IconUser className="h-[18px] w-[18px]" />}
          value={form.username}
          onChange={onChange}
        />

        <AuthField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          icon={<IconMail className="h-[18px] w-[18px]" />}
          value={form.email}
          onChange={onChange}
        />

        <AuthField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          icon={<IconLock className="h-[18px] w-[18px]" />}
          value={form.password}
          onChange={onChange}
          hint="Use at least 8 characters for a secure account."
        />

        <AuthField
          id="password_confirm"
          name="password_confirm"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repeat password"
          icon={<IconLock className="h-[18px] w-[18px]" />}
          value={form.password_confirm}
          onChange={onChange}
        />

        <button type="submit" className="btn-auth w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-form__legal">
          By registering you agree to use this store for personal top-up purchases. See our{" "}
          <Link to={PRIVACY_PATH} className="auth-link auth-link--sm">
            Privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
