import {
  ANNOUNCEMENTS,
  CURRENCY,
  DEMO_USER,
  GAME_CATALOG,
  INITIAL_TOP_UPS,
  PAYMENT_METHODS,
} from "./dummyData";

const STORAGE_KEY = "banana_frontend_mock_v1";

export class MockError extends Error {
  constructor(message, { status = 400, code, data } = {}) {
    super(message);
    this.name = "MockError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultState() {
  return {
    users: [clone(DEMO_USER)],
    topUps: { [DEMO_USER.id]: clone(INITIAL_TOP_UPS) },
    deleteRequests: {},
    orderCounter: 1000,
    resetTokens: {},
    verifyTokens: {},
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return defaultState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function refreshState() {
  state = loadState();
}

export function mockDelay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...rest } = user;
  return clone(rest);
}

function findUserByEmail(email) {
  const normalized = (email || "").trim().toLowerCase();
  return state.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

function findUserById(id) {
  return state.users.find((u) => u.id === id) || null;
}

export function getUserIdFromToken(token) {
  if (!token || !token.startsWith("mock-access-")) return null;
  return token.slice("mock-access-".length);
}

export function requireUser(token) {
  const userId = getUserIdFromToken(token);
  if (!userId) {
    throw new MockError("Authentication required.", { status: 401 });
  }
  const user = findUserById(userId);
  if (!user) {
    throw new MockError("Session expired. Please sign in again.", { status: 401 });
  }
  if (!user.verified) {
    throw new MockError("Please activate your account before signing in.", {
      status: 401,
      code: "email_not_verified",
    });
  }
  return user;
}

function makeTokens(userId) {
  return {
    access: `mock-access-${userId}`,
    refresh: `mock-refresh-${userId}`,
  };
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findGame(code) {
  return GAME_CATALOG.find((g) => g.code === code) || null;
}

function resolveRegion(game, region) {
  const regions = game.regions || [];
  if (!regions.length) return "global";
  if (region && regions.some((r) => r.code === region)) return region;
  return regions[0].code;
}

export function getGamesList() {
  return {
    currency: CURRENCY,
    games: GAME_CATALOG.map(({ code, name, image_url, min_price, currency }) => ({
      code,
      name,
      image_url,
      min_price,
      currency,
    })),
  };
}

export function getGameDetail(code, region) {
  const game = findGame(code);
  if (!game) {
    throw new MockError("This game is not available right now.", { status: 404 });
  }

  const activeRegion = resolveRegion(game, region);
  const packages = clone(game.packagesByRegion[activeRegion] || []);

  return {
    currency: CURRENCY,
    game: {
      code: game.code,
      name: game.name,
      image_url: game.image_url,
    },
    regions: clone(game.regions),
    active_region: activeRegion,
    packages,
    fields: clone(game.fields),
    servers: game.servers ? clone(game.servers) : null,
  };
}

export function checkPlayer(code, { player_id: playerId }) {
  const id = String(playerId || "").trim();
  if (!id || id.length < 6) {
    return { valid: "invalid", message: "Invalid game ID." };
  }
  if (id.startsWith("000")) {
    return { valid: "invalid", name: null };
  }
  return {
    valid: "valid",
    name: `Player${id.slice(-4)}`,
    player_id: id,
  };
}

export function createOrder(user, code, { catalogue_name: catalogueName, player_id: playerId }) {
  const detail = getGameDetail(code);
  const pkg = detail.packages.find((p) => p.name === catalogueName);
  if (!pkg) {
    throw new MockError("Package not found. Refresh the page and try again.");
  }

  const price = Number(pkg.amount);
  if (user.wallet_balance < price) {
    throw new MockError("Insufficient wallet balance. Add funds to your wallet first.");
  }

  user.wallet_balance -= price;
  state.orderCounter += 1;
  const orderId = String(state.orderCounter);
  saveState(state);

  return {
    order_id: orderId,
    message: "Your top-up is being processed.",
    order: {
      order_id: orderId,
      status: "COMPLETED",
      player_name: `Player${String(playerId).slice(-4)}`,
      catalogue: catalogueName,
      denom_id: catalogueName,
    },
    status: "COMPLETED",
  };
}

export function getOrderStatus(orderId) {
  return {
    order_id: orderId,
    order: {
      order_id: orderId,
      status: "COMPLETED",
    },
    status: "COMPLETED",
  };
}

export function getAnnouncements() {
  return clone(ANNOUNCEMENTS);
}

export function getPaymentMethods() {
  return clone(PAYMENT_METHODS);
}

export function getWalletSummary(user) {
  const topUps = state.topUps[user.id] || [];
  const pendingTopUps = topUps.filter((t) => t.status === "pending").length;
  return {
    wallet_balance: user.wallet_balance,
    currency: CURRENCY,
    pending_top_ups: pendingTopUps,
  };
}

export function getMyTopUps(userId) {
  return clone(state.topUps[userId] || []);
}

export function submitTopUp(user, { amount, paymentMethodId }) {
  const method = PAYMENT_METHODS.find((m) => m.id === paymentMethodId);
  if (!method) {
    throw new MockError("Choose a valid payment method.");
  }

  const entry = {
    id: nextId("tu"),
    amount: Number(amount),
    status: "pending",
    payment_method_name: method.name,
    transaction_last6: String(Math.floor(100000 + Math.random() * 900000)).slice(-6),
    created_at: new Date().toISOString(),
    admin_note: "",
  };

  if (!state.topUps[user.id]) state.topUps[user.id] = [];
  state.topUps[user.id].unshift(entry);
  saveState(state);

  return {
    detail: "Top-up submitted. We will review it shortly.",
    top_up: entry,
  };
}

export function registerUser({ username, email, password, password_confirm }) {
  refreshState();

  if (!username?.trim() || username.trim().length < 2) {
    throw new MockError("Username must be at least 2 characters.");
  }
  if (!email?.trim()) {
    throw new MockError("Email is required.");
  }
  if (!password || password.length < 8) {
    throw new MockError("Password must be at least 8 characters.");
  }
  if (password !== password_confirm) {
    throw new MockError("Passwords do not match.");
  }

  const existing = findUserByEmail(email);
  if (existing) {
    if (!existing.verified) {
      return {
        email: existing.email,
        activation_required: true,
        detail: "Activation email sent.",
      };
    }
    throw new MockError("An account with this email already exists.");
  }

  const user = {
    id: nextId("user"),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: "",
    wallet_balance: 0,
    verified: true,
    profile: null,
  };

  state.users.push(user);
  state.topUps[user.id] = [];
  saveState(state);

  const tokens = makeTokens(user.id);
  return {
    ...tokens,
    user: publicUser(user),
  };
}

export function loginUser({ email, password }) {
  refreshState();
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new MockError("Invalid email or password.");
  }
  if (!user.verified) {
    throw new MockError("Please activate your account before signing in.", {
      status: 401,
      code: "email_not_verified",
    });
  }

  const tokens = makeTokens(user.id);
  return {
    ...tokens,
    user: publicUser(user),
  };
}

export function fetchMe(token) {
  refreshState();
  const user = requireUser(token);
  return publicUser(user);
}

export async function updateUser(token, data) {
  refreshState();
  const user = requireUser(token);

  if (data instanceof FormData) {
    const username = data.get("username");
    const phone = data.get("phone");
    const password = data.get("password");
    const profile = data.get("profile");

    if (typeof username === "string" && username.trim()) {
      user.username = username.trim();
    }
    if (typeof phone === "string") {
      user.phone = phone.trim();
    }
    if (typeof password === "string" && password) {
      if (password.length < 8) {
        throw new MockError("Password must be at least 8 characters.");
      }
      user.password = password;
    }
    if (profile instanceof File) {
      user.profile = await fileToDataUrl(profile);
    }
  } else if (data && typeof data === "object") {
    if (data.username) user.username = String(data.username).trim();
    if (data.phone != null) user.phone = String(data.phone).trim();
    if (data.password) {
      if (data.password.length < 8) {
        throw new MockError("Password must be at least 8 characters.");
      }
      user.password = data.password;
    }
  }

  saveState(state);
  return publicUser(user);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new MockError("Could not read profile photo."));
    reader.readAsDataURL(file);
  });
}

export function verifyEmailToken(token) {
  refreshState();
  if (!token || token === "invalid") {
    throw new MockError("This verification link is invalid or expired.");
  }
  return { detail: "Your email is confirmed — you can sign in and top up." };
}

export function resendVerification(email) {
  refreshState();
  const user = findUserByEmail(email);
  if (user && !user.verified) {
    return { detail: "If an account exists, we sent a new activation link." };
  }
  return { detail: "If an account exists, we sent a new link." };
}

export function forgotPassword(email) {
  refreshState();
  const user = findUserByEmail(email);
  if (user) {
    const token = nextId("reset");
    state.resetTokens[token] = user.id;
    saveState(state);
  }
  return { detail: "If an account exists, we sent a password reset link." };
}

export function validateResetToken(token) {
  refreshState();
  if (!token || !state.resetTokens[token]) {
    throw new MockError("This reset link is invalid or expired.");
  }
  return { valid: true };
}

export function resetPassword({ token, password, password_confirm }) {
  refreshState();
  const userId = state.resetTokens[token];
  if (!userId) {
    throw new MockError("This reset link is invalid or expired.");
  }
  if (!password || password.length < 8) {
    throw new MockError("Password must be at least 8 characters.");
  }
  if (password !== password_confirm) {
    throw new MockError("Passwords do not match.");
  }

  const user = findUserById(userId);
  if (!user) {
    throw new MockError("This reset link is invalid or expired.");
  }

  user.password = password;
  delete state.resetTokens[token];
  saveState(state);

  return { detail: "Password updated. Sign in with your new password." };
}

export function fetchDeleteRequest(token) {
  refreshState();
  const user = requireUser(token);
  const request = state.deleteRequests[user.id];
  if (!request) {
    return { pending: false, request: null };
  }
  return { pending: true, request: clone(request) };
}

export function submitDeleteRequest(token, { password, reason, message, confirm }) {
  refreshState();
  const user = requireUser(token);

  if (!confirm) {
    throw new MockError("Please confirm that you want to delete your account.");
  }
  if (!password || user.password !== password) {
    throw new MockError("Incorrect password.");
  }
  if (state.deleteRequests[user.id]) {
    throw new MockError("You already have a pending deletion request.");
  }

  const request = {
    id: nextId("del"),
    reason: reason || "",
    message: message || "",
    created_at: new Date().toISOString(),
    status: "pending",
  };

  state.deleteRequests[user.id] = request;
  saveState(state);

  return {
    detail: "Deletion request submitted. Our team will review it shortly.",
    request: clone(request),
  };
}

export { findUserById, findUserByEmail };
