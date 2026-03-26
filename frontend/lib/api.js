import axios from 'axios';

// Prefer an explicit NEXT_PUBLIC_API_URL if it looks like a full URL,
// otherwise fall back to the local backend (helps avoid bad relative values like "/api").
const API_URL =
  (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http'))
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem('token');
    const staffToken = localStorage.getItem('staff_token');
    const customerToken = localStorage.getItem('customer_token');

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
    } else if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    }
    return config;
  });
}

// Staff API functions
export const staffAPI = {
  login: (data) => api.post('/staff/login', data),
  getProfile: () => api.get('/staff/profile'),
};

// Admin API functions
export const adminAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getProfile: () => api.get('/hotel/profile'),
  updateProfile: (data) => api.put('/hotel/profile', data),
  getQR: () => api.get('/hotel/qr'),
  getTables: () => api.get('/tables'),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.put(`/tables/${id}`, data),
  updateTableLayout: (id, layout) => api.put(`/tables/${id}/layout`, { layout }),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  getMenu: (category) => api.get('/menu', { params: { category } }),
  createMenuItem: (data) => api.post('/menu', data),
  updateMenuItem: (id, data) => api.put(`/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/menu/${id}`),
  generateMenuDescription: (data) => api.post('/menu/generate-ai', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status, paymentMethod = null) => {
    const payload = { status };
    if (paymentMethod) payload.paymentMethod = paymentMethod;
    return api.put(`/orders/${id}/status`, payload);
  },
  createOrder: (data) => api.post('/customer/orders', data), // Reusing customer order for consistency

  // Inventory
  getInventory: () => api.get('/inventory'),
  updateInventory: (data) => api.post('/inventory', data),
  restockInventory: (id, data) => api.post(`/inventory/${id}/restock`, data),

  getReservations: (params) => api.get('/reservations', { params }),
  createReservation: (data) => api.post('/reservations', data),
  updateReservationStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),
  updateReservation: (id, data) => api.put(`/reservations/${id}/status`, data),

  // Staff
  getStaff: () => api.get('/staff'),
  createStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.put(`/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),

  // Coupons
  getCoupons: () => api.get('/coupons'),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),

  // Reviews
  getReviews: (params) => api.get('/reviews', { params }),
  respondToReview: (id, response) => api.put(`/reviews/${id}/respond`, { response }),

  // Analytics
  getAnalytics: (params) => api.get('/analytics', { params }),
  getDashboardStats: (startDate, endDate) => api.get('/analytics/dashboard', { params: { startDate, endDate } }),
  exportAnalytics: (startDate, endDate, type) => api.get('/analytics/export', {
    params: { startDate, endDate, type },
    responseType: 'blob'
  }),
  emailDailyReport: () => api.post('/analytics/email-daily-report'),
  emailTotalReport: () => api.post('/analytics/email-total-report'),
  emailFilteredReport: (data) => api.post('/analytics/email-filtered-report', data),
  emailCustomReport: (data) => api.post('/analytics/email-custom-report', data),

  // Kitchen
  getKitchenOrders: () => api.get('/kitchen/orders'),
  updateKitchenItemStatus: (orderId, itemId, status) => api.put(`/kitchen/orders/${orderId}/items/${itemId}`, { status }),

  // Waitlist
  getWaitlist: () => api.get('/waitlist'),
  addToWaitlist: (data) => api.post('/waitlist', data),
  updateWaitlistStatus: (id, status) => api.put(`/waitlist/${id}/status`, { status }),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),

  // Feedback
  getFeedback: () => api.get('/feedback'),
  resolveFeedback: (id) => api.put(`/feedback/${id}/resolve`),
  uploadHotelImages: (data) => api.post('/uploads/hotel', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Customer API functions
export const customerAPI = {
  getHotelByQR: (qrCode) => api.get(`/customer/hotel/${qrCode}`),
  checkContact: (params) => api.get('/customer/check-contact', { params }),
  login: (data) => api.post('/customer/login', data),
  getCustomer: (id) => api.get(`/customer/${id}`),
  updateProfile: (id, data) => api.put(`/customer/${id}`, data),
  getMenu: (hotelId, category) => api.get(`/customer/menu/${hotelId}`, { params: { category } }),
  getTables: (hotelId) => api.get(`/customer/tables/${hotelId}`),
  createOrder: (data) => api.post('/customer/orders', data),
  getOrders: (customerId) => api.get(`/customer/orders/${customerId}`),
  getGlobalOrders: (identifier) => api.get(`/customer/orders/global/${identifier}`),
  getVisitSummary: (identifier) => api.get(`/customer/visits/summary/${identifier}`),
  getOrder: (orderId) => api.get(`/customer/order/${orderId}`),

  // Customer Reservations
  createReservation: (data) => api.post('/reservations', data),
  getReservations: (customerId, status) => api.get(`/reservations/customer/${customerId}`, { params: status ? { status } : {} }),
  getDataAvailableSlots: (tableId, date) => api.get('/reservations/available-slots', { params: { tableId, date } }),

  // Customer Reviews
  getReviews: (hotelId) => api.get(`/reviews/hotel/${hotelId}`),
  createReview: (data) => api.post('/reviews', data),

  // Customer Feedback
  createFeedback: (data) => api.post('/feedback', data),

  // Payments
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),

  // Customer Preferences
  getPreferences: (customerId) => api.get(`/preferences/${customerId}`),
  updatePreferences: (data) => api.post('/preferences', data),
  addFavorite: (customerId, menuItemId) => api.post('/preferences/favorites', { customerId, menuItemId }),
  removeFavorite: (customerId, menuItemId) => api.delete(`/preferences/favorites/${customerId}/${menuItemId}`),
  updateLoyalty: (customerId, points, action) => api.post('/preferences/loyalty', { customerId, points, action }),

  // Customer Waitlist
  addToWaitlist: (data) => api.post('/waitlist', data),
  getWaitlistEstimate: (hotelId, numberOfGuests) => api.get('/waitlist/estimate', { params: { hotelId, numberOfGuests } }),
  getWaitlistStatus: (hotelId, phone) => api.get('/waitlist/status', { params: { hotelId, phone } }),

  // Coupons
  validateCoupon: (code, orderAmount, hotelId) => api.post('/coupons/validate', { code, orderAmount, hotelId }),

  // Recommendations
  getRecommendations: (customerId, hotelId) => api.get(`/recommendations/${customerId}`, { params: { hotelId } }),

  // Reports
  sendSpendingReport: (customerId) => api.post(`/customer/${customerId}/send-report`),
  sendGlobalSpendingReport: (data) => api.post('/customer/report/global', data),

  // 7 IDEAS - INTERACTIVE
  createMysteryOrder: (data) => api.post('/customer/order/mystery', data),
  sendGift: (data) => api.post('/customer/gift', data),
  castVote: (data) => api.post('/customer/poll/vote', data),
  runBillRoulette: (data) => api.post('/customer/orders/roulette', data),
  claimRewardPoints: (data) => api.post('/customer/reward/claim', data),
};

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  voiceOrder: (data) => api.post('/ai/voice-order', data),
};

export default api;
