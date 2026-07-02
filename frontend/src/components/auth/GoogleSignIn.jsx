import { useEffect, useRef, useState } from "react";
import { fetchGoogleAuthConfig } from "../../api/auth";
import { initGoogleSignIn, loadGoogleIdentityScript } from "../../utils/googleIdentity";

export default function GoogleSignIn({ onCredential, disabled = false, referralCode }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    fetchGoogleAuthConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfig({ enabled: false, clientId: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config?.enabled || !config.clientId || disabled) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;

    const init = async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !buttonRef.current) return;

        initGoogleSignIn({
          clientId: config.clientId,
          callback: (credential) => onCredentialRef.current?.(credential),
          context: referralCode ? "signup" : "signin",
        });

        buttonRef.current.innerHTML = "";
        const width = Math.min(Math.max(buttonRef.current.offsetWidth || 360, 280), 400);
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: referralCode ? "signup_with" : "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width,
        });

        if (!cancelled) {
          setReady(true);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          setError(err?.message || "Google Sign-In unavailable");
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [config, disabled, referralCode]);

  if (!config?.enabled) return null;

  return (
    <div className="google-signin">
      <div
        ref={buttonRef}
        className={`google-signin__button ${ready ? "google-signin__button--ready" : ""}`}
        aria-hidden={!ready}
      />
      {!ready && !error ? (
        <div className="google-signin__placeholder" aria-hidden>
          Loading Google…
        </div>
      ) : null}
      {error ? <p className="auth-field__hint text-center">{error}</p> : null}
    </div>
  );
}
