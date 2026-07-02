let gsiPromise = null;
let initializedClientId = null;
let initializedContext = null;
let credentialHandler = null;
let configPromise = null;

export function setGoogleCredentialHandler(handler) {
  credentialHandler = typeof handler === "function" ? handler : null;
}

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

export function prefetchGoogleIdentity() {
  loadGoogleIdentityScript().catch(() => {});
}

/** Initialize GIS once per client ID (avoids GSI_LOGGER duplicate-init warnings). */
export function initGoogleSignIn({ clientId, context = "signin" }) {
  if (!clientId || !window.google?.accounts?.id) {
    throw new Error("Google Sign-In is not ready");
  }

  const needsInit =
    initializedClientId !== clientId || initializedContext !== context;

  if (needsInit) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) credentialHandler?.(response.credential);
      },
      context,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });
    initializedClientId = clientId;
    initializedContext = context;
  }
}

export function renderGoogleButton(container, { text = "continue_with", width = 360 } = {}) {
  if (!container || !window.google?.accounts?.id) return;
  container.innerHTML = "";
  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "filled_black",
    size: "large",
    text,
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(Math.max(width, 280), 400),
  });
}

export function triggerGoogleSignInFlow(container) {
  if (!container) return false;

  const candidates = [
    container.querySelector('div[role="button"]'),
    container.querySelector('[tabindex="0"]'),
    container.querySelector("iframe"),
    container.firstElementChild,
  ].filter(Boolean);

  for (const node of candidates) {
    try {
      node.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
      );
      if (typeof node.click === "function") {
        node.click();
      }
      return true;
    } catch {
      // try next candidate
    }
  }

  return false;
}

export function promptGoogleSignIn() {
  if (!window.google?.accounts?.id?.prompt) return false;
  window.google.accounts.id.prompt();
  return true;
}

export function fetchGoogleAuthConfigCached(fetcher) {
  if (!configPromise) {
    configPromise = fetcher().catch((err) => {
      configPromise = null;
      throw err;
    });
  }
  return configPromise;
}
