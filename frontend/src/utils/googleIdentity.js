let gsiPromise = null;
let initializedClientId = null;

export function loadGoogleIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In is only available in the browser"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load Google Sign-In")), {
          once: true,
        });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Google Sign-In"));
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

/** Initialize GIS once per client ID (avoids GSI_LOGGER duplicate-init warnings). */
export function initGoogleSignIn({ clientId, callback, context = "signin" }) {
  if (!clientId || !window.google?.accounts?.id) {
    throw new Error("Google Sign-In is not ready");
  }
  if (initializedClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) callback?.(response.credential);
      },
      context,
      ux_mode: "popup",
      auto_select: false,
      itp_support: true,
    });
    initializedClientId = clientId;
  }
}
