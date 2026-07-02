import { apiRequest } from "./client";
import { setStoreCurrency } from "../utils/format";

function normalizeVoucherProduct(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    image_url: item.imageUrl ?? item.image_url ?? null,
    category_id: item.categoryId ?? item.category_id,
    category_title: item.categoryTitle ?? item.category_title,
    unit_price: item.unitPrice ?? item.unit_price,
    face_value: item.faceValue ?? item.face_value,
    in_stock: item.inStock ?? item.in_stock ?? (item.stock > 0),
  };
}

function normalizeCategory(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    image_url: item.imageUrl ?? item.image_url ?? null,
    product_count: item.productCount ?? item.product_count ?? 0,
    min_price_mmk: item.minPriceMmk ?? item.min_price_mmk,
  };
}

export async function fetchVoucherCategories() {
  const data = await apiRequest("/api/vouchers/categories", { requireAuth: false });
  return (Array.isArray(data) ? data : []).map(normalizeCategory);
}

export async function fetchVoucherProducts(categoryId) {
  const query =
    categoryId != null && categoryId !== ""
      ? `?categoryId=${encodeURIComponent(categoryId)}`
      : "";
  const data = await apiRequest(`/api/vouchers${query}`, { requireAuth: false });
  const products = (Array.isArray(data) ? data : []).map(normalizeVoucherProduct);
  if (products[0]?.currency) setStoreCurrency(products[0].currency);
  return products;
}

export async function fetchVoucherProduct(id) {
  const data = await apiRequest(`/api/vouchers/${id}`, { requireAuth: false });
  const product = normalizeVoucherProduct(data);
  if (product?.currency) setStoreCurrency(product.currency);
  return product;
}

export async function createVoucherOrder({ g2bulkProductId, unitPrice, quantity = 1 }) {
  return apiRequest("/api/orders", {
    method: "POST",
    body: {
      paymentMethod: "wallet",
      items: [
        {
          g2bulkProductId,
          unitPrice,
          quantity: Math.max(1, Math.floor(quantity)),
        },
      ],
    },
  });
}

export async function fetchVoucherOrderStatus(orderId) {
  return apiRequest(`/api/orders/${orderId}`);
}

export function extractVoucherCodes(result) {
  const order = result?.order ?? result;
  const codes = order?.voucherCodes;
  if (!Array.isArray(codes) || !codes.length) return [];
  return codes.map((row) => row?.voucherCode ?? row).filter(Boolean);
}
