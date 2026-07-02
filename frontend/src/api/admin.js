import { apiRequest } from "./client";

const wrap = (promise) => promise.then((data) => ({ data }));

export const adminApi = {
  // Dashboard
  getDashboardStats: () => wrap(apiRequest("/api/admin/dashboard")),

  // Notifications
  getNotifications: () => wrap(apiRequest("/api/admin/notifications")),
  sendNotifications: (data) =>
    wrap(apiRequest("/api/admin/notifications/send", { method: "POST", body: data })),

  // Live chat
  getChatConversations: (status) =>
    wrap(apiRequest("/api/admin/chat/conversations", { params: status ? { status } : {} })),
  getChatMessages: (id, since) =>
    wrap(
      apiRequest(`/api/admin/chat/conversations/${id}/messages`, {
        params: since ? { since: String(since) } : {},
      }),
    ),
  sendChatReply: (id, body) =>
    wrap(
      apiRequest(`/api/admin/chat/conversations/${id}/messages`, {
        method: "POST",
        body: { body },
      }),
    ),
  closeChatConversation: (id) =>
    wrap(apiRequest(`/api/admin/chat/conversations/${id}/close`, { method: "POST" })),

  // Reports
  getSalesReport: (from, to) =>
    wrap(apiRequest("/api/admin/reports/sales", { params: { from, to } })),

  // Activity
  getActivityLogs: (limit) => wrap(apiRequest("/api/admin/activity", { params: { limit } })),

  // Referrals
  getReferralStats: () => wrap(apiRequest("/api/admin/referrals")),

  // Users
  getAllUsers: () => wrap(apiRequest("/api/admin/users")),
  getUserOrders: (userId) => wrap(apiRequest(`/api/admin/users/${userId}/orders`)),
  updateUserRole: (userId, role) =>
    wrap(apiRequest(`/api/admin/users/${userId}/role`, { method: "PUT", body: { role } })),
  updateUser: (userId, data) =>
    wrap(apiRequest(`/api/admin/users/${userId}`, { method: "PUT", body: data })),
  banUser: (userId, reason) =>
    wrap(apiRequest(`/api/admin/users/${userId}/ban`, { method: "POST", body: { reason } })),
  unbanUser: (userId) =>
    wrap(apiRequest(`/api/admin/users/${userId}/unban`, { method: "POST" })),
  adjustUserWallet: (userId, amount, note) =>
    wrap(apiRequest(`/api/admin/users/${userId}/wallet`, { method: "PUT", body: { amount, note } })),

  // Orders
  getAllOrders: () => wrap(apiRequest("/api/admin/orders")),
  getOrderDetail: (orderId) => wrap(apiRequest(`/api/admin/orders/${orderId}`)),
  updateOrderStatus: (orderId, status) =>
    wrap(apiRequest(`/api/admin/orders/${orderId}/status`, { method: "PUT", body: { status } })),
  verifyPayment: (orderId) =>
    wrap(apiRequest(`/api/admin/orders/${orderId}/verify-payment`, { method: "POST" })),
  retryFulfillment: (orderId) =>
    wrap(apiRequest(`/api/admin/orders/${orderId}/retry-fulfillment`, { method: "POST" })),
  rejectPayment: (orderId, dto) =>
    wrap(apiRequest(`/api/admin/orders/${orderId}/reject-payment`, { method: "POST", body: dto })),
  refundOrder: (orderId, reason) =>
    wrap(apiRequest(`/api/admin/orders/${orderId}/refund`, { method: "POST", body: { reason } })),

  // Products
  getAllProducts: () => wrap(apiRequest("/api/admin/products")),
  createProduct: (data) => wrap(apiRequest("/api/admin/products", { method: "POST", body: data })),
  updateProduct: (id, data) =>
    wrap(apiRequest(`/api/admin/products/${id}`, { method: "PUT", body: data })),
  deleteProduct: (id) => wrap(apiRequest(`/api/admin/products/${id}`, { method: "DELETE" })),
  toggleProductActive: (data) =>
    wrap(apiRequest("/api/admin/products/toggle-active", { method: "PUT", body: data })),

  // Wallet
  getWalletTransactions: (limit) =>
    wrap(apiRequest("/api/admin/wallet/transactions", { params: { limit } })),
  getPendingWalletTopups: () => wrap(apiRequest("/api/admin/wallet/topups", { params: { status: "PENDING" } })),
  getWalletTopups: (status) =>
    wrap(apiRequest("/api/admin/wallet/topups", { params: status ? { status } : {} })),
  verifyWalletTopup: (id) =>
    wrap(apiRequest(`/api/admin/wallet/topups/${id}/verify`, { method: "POST" })),
  rejectWalletTopup: (id, reason) =>
    wrap(apiRequest(`/api/admin/wallet/topups/${id}/reject`, { method: "POST", body: { reason } })),

  // Settings
  getExchangeSettings: () => wrap(apiRequest("/api/admin/settings/exchange")),
  updateExchangeSettings: (data) =>
    wrap(apiRequest("/api/admin/settings/exchange", { method: "PUT", body: data })),
  getShopSettings: () => wrap(apiRequest("/api/admin/settings/shop")),
  updateShopSettings: (data) =>
    wrap(apiRequest("/api/admin/settings/shop", { method: "PUT", body: data })),
  getIntegrationSettings: () => wrap(apiRequest("/api/admin/settings/integrations")),
  updateIntegrationSettings: (data) =>
    wrap(apiRequest("/api/admin/settings/integrations", { method: "PUT", body: data })),
  testSmtp: (to) =>
    wrap(apiRequest("/api/admin/settings/integrations/test-smtp", { method: "POST", body: { to } })),

  // G2Bulk
  getG2bulkDashboard: () => wrap(apiRequest("/api/admin/g2bulk/dashboard")),
  getG2bulkPriceAlerts: (limit) =>
    wrap(apiRequest("/api/admin/g2bulk/price-alerts", { params: { limit } })),
  checkG2bulkPrices: (force) =>
    wrap(apiRequest("/api/admin/g2bulk/check-prices", { method: "POST", params: { force } })),
  testG2bulkConnection: () =>
    wrap(apiRequest("/api/admin/g2bulk/test-connection", { method: "POST" })),
  dismissAllG2bulkPriceAlerts: () =>
    wrap(apiRequest("/api/admin/g2bulk/price-alerts/dismiss-all", { method: "POST" })),
  dismissG2bulkPriceAlert: (id) =>
    wrap(apiRequest(`/api/admin/g2bulk/price-alerts/${id}/dismiss`, { method: "POST" })),

  // Promos
  getAllPromos: () => wrap(apiRequest("/api/admin/promos")),
  createPromo: (dto) => wrap(apiRequest("/api/admin/promos", { method: "POST", body: dto })),
  updatePromo: (id, dto) =>
    wrap(apiRequest(`/api/admin/promos/${id}`, { method: "PUT", body: dto })),
  deletePromo: (id) => wrap(apiRequest(`/api/admin/promos/${id}`, { method: "DELETE" })),

  // Banners
  getBanners: () => wrap(apiRequest("/api/admin/banners")),
  createBanner: (data) => wrap(apiRequest("/api/admin/banners", { method: "POST", body: data })),
  updateBanner: (id, data) =>
    wrap(apiRequest(`/api/admin/banners/${id}`, { method: "PUT", body: data })),
  deleteBanner: (id) => wrap(apiRequest(`/api/admin/banners/${id}`, { method: "DELETE" })),

  // Events
  getEvents: () => wrap(apiRequest("/api/admin/events")),
  createEvent: (data) => wrap(apiRequest("/api/admin/events", { method: "POST", body: data })),
  updateEvent: (id, data) =>
    wrap(apiRequest(`/api/admin/events/${id}`, { method: "PUT", body: data })),
  deleteEvent: (id) => wrap(apiRequest(`/api/admin/events/${id}`, { method: "DELETE" })),

  // Legal Pages
  getLegalPage: (slug) => wrap(apiRequest(`/api/admin/legal/${slug}`)),
  updateLegalPage: (slug, data) =>
    wrap(apiRequest(`/api/admin/legal/${slug}`, { method: "PUT", body: data })),

  // Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return wrap(apiRequest("/api/admin/upload", { method: "POST", body: formData }));
  },
  uploadBase64: (data) =>
    wrap(apiRequest("/api/admin/upload/base64", { method: "POST", body: { data } })),

  // 2FA
  get2faStatus: () => wrap(apiRequest("/api/admin/2fa/status")),
  setup2fa: () => wrap(apiRequest("/api/admin/2fa/setup", { method: "POST" })),
  enable2fa: (code) => wrap(apiRequest("/api/admin/2fa/enable", { method: "POST", body: { code } })),
  disable2fa: (password, code) =>
    wrap(apiRequest("/api/admin/2fa/disable", { method: "POST", body: { password, code } })),
};
