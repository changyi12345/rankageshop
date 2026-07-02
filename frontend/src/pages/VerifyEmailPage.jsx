import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import AuthCard from "../components/auth/AuthCard";

const COPY = {
  verify: {
    loadingBadge: "Verification",
    loadingTitle: "Confirming email",
    loadingSubtitle: "Linking your account…",
    successBadge: "Verified",
    successTitle: "Email confirmed",
    successFallback: "Your email is confirmed — you can sign in and top up.",
    errorBadge: "Error",
    errorTitle: "Verification failed",
    missingToken: "Missing verification token. Use the link from your email.",
  },
  activate: {
    loadingBadge: "Activation",
    loadingTitle: "Activating account",
    loadingSubtitle: "Enabling your account…",
    successBadge: "Active",
    successTitle: "Account activated",
    successFallback: "Your account is active — you can sign in and top up.",
    errorBadge: "Error",
    errorTitle: "Activation failed",
    missingToken: "Missing activation token. Use the link from your email.",
  },
};

export default function VerifyEmailPage({ mode = "verify" }) {
  const copy = COPY[mode] || COPY.verify;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const text = COPY[mode] || COPY.verify;
    if (!token) {
      setStatus("error");
      setMessage(text.missingToken);
      return;
    }

    let cancelled = false;
    verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(res.detail || text.successFallback);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || text.errorTitle);
      });

    return () => {
      cancelled = true;
    };
  }, [token, mode]);

  if (status === "loading") {
    return (
      <AuthCard badge={copy.loadingBadge} title={copy.loadingTitle} subtitle={copy.loadingSubtitle}>
        <div className="auth-form__spinner-wrap">
          <span className="auth-loading__spinner" aria-hidden />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard badge={copy.successBadge} title={copy.successTitle} subtitle={message}>
        <Link to="/login?verified=1" className="btn-auth w-full text-center">
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard badge={copy.errorBadge} title={copy.errorTitle} subtitle={message}>
      <div className="auth-form__actions">
        {mode === "verify" ? (
          <Link to="/register" className="btn-secondary w-full text-center">
            Register again
          </Link>
        ) : null}
        <Link to="/login" className="btn-auth w-full text-center">
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}
