import { useCallback, useEffect, useRef, useState } from "react";
import { fetchGoogleAuthConfig } from "../../api/auth";
import { IconGoogle } from "./AuthIcons";
import {
  fetchGoogleAuthConfigCached,
  initGoogleSignIn,
  loadGoogleIdentityScript,
  promptGoogleSignIn,
  renderGoogleButton,
  setGoogleCredentialHandler,
  triggerGoogleSignInFlow,
} from "../../utils/googleIdentity";

function clampButtonWidth(width) {
  return Math.min(Math.max(Math.floor(width), 200), 400);
}

export default function GoogleSignIn({ onCredential, busy = false, referralCode }) {
  const hostRef = useRef(null);
  const sandboxRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const activatingRef = useRef(false);
  const lastWidthRef = useRef(0);
  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const label = referralCode ? "Sign up with Google" : "Continue with Google";

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
    if (!config?.enabled || !config.clientId || !hostRef.current) {
      return undefined;
    }

    let cancelled = false;
    let resizeObserver;

    const mountButton = async (width) => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !sandboxRef.current || !hostRef.current) return;

        initGoogleSignIn({
          clientId: config.clientId,
          context: referralCode ? "signup" : "signin",
        });

        const nextWidth = clampButtonWidth(width);
        if (lastWidthRef.current !== nextWidth) {
          renderGoogleButton(sandboxRef.current, {
            text: referralCode ? "signup_with" : "continue_with",
            width: nextWidth,
          });
          lastWidthRef.current = nextWidth;
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

    const measureAndMount = () => {
      const width = hostRef.current?.offsetWidth ?? 0;
      if (width > 0) mountButton(width);
    };

    measureAndMount();

    if (typeof ResizeObserver !== "undefined" && hostRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width > 0) mountButton(width);
      });
      resizeObserver.observe(hostRef.current);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [config, referralCode]);

  const activateGoogleSignIn = useCallback(async () => {
    if (!ready || busy || activatingRef.current || !config?.clientId) return;

    activatingRef.current = true;
    setError("");

    try {
      await loadGoogleIdentityScript();
      initGoogleSignIn({
        clientId: config.clientId,
        context: referralCode ? "signup" : "signin",
      });

      const triggered = triggerGoogleSignInFlow(sandboxRef.current);
      if (!triggered) {
        promptGoogleSignIn();
      }
    } catch (err) {
      setError(err?.message || "Google Sign-In unavailable");
    } finally {
      window.setTimeout(() => {
        activatingRef.current = false;
      }, 800);
    }
  }, [busy, config, ready, referralCode]);

  if (config === null) {
    return (
      <div className="google-signin" aria-hidden>
        <div className="google-signin__face google-signin__face--loading">
          <span className="google-signin__placeholder-spinner" aria-hidden />
          Loading Google…
        </div>
      </div>
    );
  }

  if (!config?.enabled) return null;

  return (
    <div
      ref={hostRef}
      className={`google-signin ${busy ? "google-signin--busy" : ""} ${ready ? "google-signin--ready" : ""}`}
    >
      <button
        type="button"
        className="google-signin__face google-signin__face--interactive"
        disabled={!ready || busy}
        aria-label={label}
        onClick={activateGoogleSignIn}
      >
        <IconGoogle className="google-signin__icon" />
        <span>{label}</span>
      </button>

      <div
        ref={sandboxRef}
        className="google-signin__sandbox"
        data-google-signin-sandbox
        aria-hidden="true"
      />

      {!ready && !error ? (
        <div className="google-signin__face google-signin__face--loading" aria-hidden>
          <span className="google-signin__placeholder-spinner" aria-hidden />
          Loading Google…
        </div>
      ) : null}

      {busy ? (
        <div className="google-signin__busy" aria-live="polite">
          <span className="google-signin__placeholder-spinner" aria-hidden />
          Signing in with Google…
        </div>
      ) : null}

      {error ? <p className="auth-field__hint mt-2 text-center">{error}</p> : null}
    </div>
  );
}
