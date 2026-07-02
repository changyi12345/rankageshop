import { useEffect, useRef, useState } from "react";
import { fetchGoogleAuthConfig } from "../../api/auth";
import {
  fetchGoogleAuthConfigCached,
  initGoogleSignIn,
  loadGoogleIdentityScript,
  renderGoogleButton,
  setGoogleCredentialHandler,
} from "../../utils/googleIdentity";

export default function GoogleSignIn({ onCredential, busy = false, referralCode }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const buttonRenderedRef = useRef(false);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    setGoogleCredentialHandler((credential) => onCredentialRef.current?.(credential));
    return () => setGoogleCredentialHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGoogleAuthConfigCached(fetchGoogleAuthConfig)
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
    if (!config?.enabled || !config.clientId) {
      return undefined;
    }

    let cancelled = false;
    buttonRenderedRef.current = false;

    const mountButton = async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !buttonRef.current) return;

        initGoogleSignIn({
          clientId: config.clientId,
          context: referralCode ? "signup" : "signin",
        });

        const container = buttonRef.current;
        const width = container.parentElement?.offsetWidth || container.offsetWidth || 360;

        if (!buttonRenderedRef.current) {
          renderGoogleButton(container, {
            text: referralCode ? "signup_with" : "continue_with",
            width,
          });
          buttonRenderedRef.current = true;
        }

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

    mountButton();

    return () => {
      cancelled = true;
    };
  }, [config, referralCode]);

  if (config === null) {
    return (
      <div className="google-signin" aria-hidden>
        <div className="google-signin__placeholder google-signin__placeholder--visible">
          <span className="google-signin__placeholder-spinner" aria-hidden />
          Loading Google…
        </div>
      </div>
    );
  }

  if (!config?.enabled) return null;

  return (
    <div className={`google-signin ${busy ? "google-signin--busy" : ""}`}>
      <div
        ref={buttonRef}
        className={`google-signin__button ${ready ? "google-signin__button--ready" : ""}`}
        aria-hidden={!ready}
      />
      <div
        className={`google-signin__placeholder ${ready ? "" : "google-signin__placeholder--visible"}`}
        aria-hidden={ready}
      >
        {!ready && !error ? (
          <>
            <span className="google-signin__placeholder-spinner" aria-hidden />
            Loading Google…
          </>
        ) : null}
      </div>
      {busy ? (
        <div className="google-signin__busy" aria-live="polite">
          <span className="google-signin__placeholder-spinner" aria-hidden />
          Signing in with Google…
        </div>
      ) : null}
      {error ? <p className="auth-field__hint text-center">{error}</p> : null}
    </div>
  );
}
