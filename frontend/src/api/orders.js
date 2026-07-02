import { apiRequest } from "./client";

function normalizeTopUpInput(input) {
  if (!input || typeof input !== "object") return null;
  return {
    gameCode: input.gameCode ?? input.game_code,
    playerId: input.playerId ?? input.player_id,
    serverId: input.serverId ?? input.server_id,
    playerName: input.playerName ?? input.player_name,
    catalogueName: input.catalogueName ?? input.catalogue_name,
  };
}

function normalizeVoucherCode(row) {
  if (!row) return null;
  if (typeof row === "string") return row;
  return row.voucherCode ?? row.voucher_code ?? null;
}

export function normalizeOrder(order) {
  if (!order || typeof order !== "object") return order;
  const product = order.product;
  return {
    id: order.id,
    status: order.status,
    type: order.type,
    paymentMethod: order.paymentMethod ?? order.payment_method,
    quantity: order.quantity ?? 1,
    totalPrice: Number(order.totalPrice ?? order.total_price ?? 0),
    createdAt: order.createdAt ?? order.created_at,
    completedAt: order.completedAt ?? order.completed_at,
    product: product
      ? {
          id: product.id,
          name: product.name,
          type: product.type,
          imageUrl: product.imageUrl ?? product.image_url ?? null,
        }
      : null,
    topUpInput: normalizeTopUpInput(order.topUpInput ?? order.top_up_input),
    voucherCodes: (order.voucherCodes ?? order.voucher_codes ?? [])
      .map(normalizeVoucherCode)
      .filter(Boolean),
  };
}

export function isGameTopUpOrder(order) {
  const type = (order?.type ?? order?.product?.type ?? "").toLowerCase();
  return type.includes("topup") || type.includes("top_up") || type === "direct_topup";
}

export function isVoucherOrder(order) {
  const type = (order?.type ?? order?.product?.type ?? "").toLowerCase();
  return type.includes("voucher");
}

export async function fetchMyOrders() {
  const data = await apiRequest("/api/orders");
  return (Array.isArray(data) ? data : []).map(normalizeOrder);
}

export async function fetchMyOrder(orderId) {
  const data = await apiRequest(`/api/orders/${orderId}`);
  return normalizeOrder(data);
}
