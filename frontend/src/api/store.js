import { apiRequest } from "./client";
import { setStoreCurrency } from "../utils/format";
import {
  isMlbbUnified,
  mlbbRegionTabs,
  MLBB_REGIONS,
  MLBB_UNIFIED_CODE,
  resolveMlbbGameCode,
} from "../utils/mlbb-regions";

function normalizeGame(game) {
  if (!game || typeof game !== "object") return game;
  return {
    ...game,
    code: game.code ?? game.slug,
    image_url: game.image_url ?? game.imageUrl ?? null,
    min_price: game.min_price ?? game.minPriceMmk ?? null,
    currency: game.currency ?? "MMK",
  };
}

function normalizePackage(pkg) {
  if (!pkg || typeof pkg !== "object") return pkg;
  return {
    ...pkg,
    amount: pkg.unitPrice ?? pkg.amount,
    currency: pkg.currency ?? "MMK",
  };
}

function fieldNamesFromPlayerFields(playerFields) {
  return (playerFields ?? []).map((f) => (typeof f === "string" ? f : f.name)).filter(Boolean);
}

function normalizeGameDetail(data, { urlCode, regionId } = {}) {
  if (!data || typeof data !== "object") return data;

  const game = normalizeGame(data);
  const playerFields = data.playerFields ?? data.player_fields ?? [];
  const fields = fieldNamesFromPlayerFields(playerFields);
  const g2bulkCode = game.code;
  const isMlbb = isMlbbUnified(urlCode ?? game.code);

  const regions = isMlbb ? mlbbRegionTabs() : (data.regions ?? []);
  const activeRegion = isMlbb
    ? regionId ?? data.active_region ?? MLBB_REGIONS[0]?.id ?? "mm"
    : data.active_region ?? regionId ?? null;

  return {
    currency: data.currency ?? "MMK",
    g2bulkCode,
    game: {
      code: isMlbb ? MLBB_UNIFIED_CODE : game.code,
      name: isMlbb ? "Mobile Legends: Bang Bang" : game.name,
      image_url: game.image_url,
    },
    regions,
    active_region: activeRegion,
    packages: (data.packages ?? []).map(normalizePackage),
    fields,
    playerFields,
    fieldNotes: data.fieldNotes ?? data.field_notes ?? null,
    servers: data.servers ?? null,
  };
}

function normalizeGamesList(data) {
  const raw = Array.isArray(data) ? data : data?.games ?? [];
  const games = raw.map(normalizeGame);
  const currency =
    (Array.isArray(data) ? games[0]?.currency : data?.currency) ?? "MMK";
  return { games, currency };
}

export async function fetchStoreGames() {
  const data = await apiRequest("/api/games", { requireAuth: false });
  const normalized = normalizeGamesList(data);
  setStoreCurrency(normalized.currency);
  return normalized;
}

export async function fetchStoreGame(code, region) {
  const apiCode = isMlbbUnified(code) ? resolveMlbbGameCode(region) : code;
  const data = await apiRequest(`/api/games/${apiCode}`, {
    requireAuth: false,
  });
  const normalized = normalizeGameDetail(data, { urlCode: code, regionId: region });
  if (normalized?.currency) setStoreCurrency(normalized.currency);
  return normalized;
}

export async function checkStorePlayer(code, payload) {
  const apiCode = isMlbbUnified(code)
    ? resolveMlbbGameCode(payload.region)
    : code;

  const fields = {};
  if (payload.player_id) fields.userid = payload.player_id;
  if (payload.server_id) fields.serverid = String(payload.server_id);
  if (payload.charname) fields.charname = payload.charname;

  return apiRequest(`/api/games/${apiCode}/validate`, {
    method: "POST",
    body: { fields },
    requireAuth: false,
  });
}

export async function createStoreOrder(code, payload) {
  const apiCode = isMlbbUnified(code)
    ? resolveMlbbGameCode(payload.region)
    : code;

  return apiRequest("/api/orders", {
    method: "POST",
    body: {
      paymentMethod: "wallet",
      items: [
        {
          gameCode: apiCode,
          g2bulkGameCode: apiCode,
          catalogueName: payload.catalogue_name,
          packageName: payload.catalogue_name,
          unitPrice: payload.unit_price,
          quantity: 1,
          playerId: payload.player_id,
          serverId: payload.server_id || undefined,
          playerName: payload.player_name || undefined,
        },
      ],
    },
  });
}

export async function fetchStoreOrderStatus(_code, orderId) {
  return apiRequest(`/api/orders/${orderId}`);
}
