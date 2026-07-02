import { apiRequest } from "./client";

export async function fetchWalletSummary() {
  return apiRequest("/api/wallet");
}

export async function fetchPaymentMethods() {
  return apiRequest("/api/wallet/payment-methods", { requireAuth: false });
}

export async function fetchMyTopUps() {
  return apiRequest("/api/wallet/topups");
}

export async function uploadPaymentProof(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/api/uploads/payment-proof", {
    method: "POST",
    body: formData,
  });
}

export async function submitWalletTopUp({ amount, paymentMethodId, proofFile }) {
  let proofImageUrl;
  if (proofFile) {
    const upload = await uploadPaymentProof(proofFile);
    proofImageUrl = upload.url;
  }

  return apiRequest("/api/wallet/topups", {
    method: "POST",
    body: {
      amount,
      payment_method_id: paymentMethodId,
      proofImageUrl,
    },
  });
}
