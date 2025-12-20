import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

// Admin API functions
export const adminAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/hotel/profile'),
  updateProfile: (data) => api.put('/hotel/profile', data),
  getQR: () => api.get('/hotel/qr'),
  getTables: () => api.get('/tables'),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.put(`/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  getMenu: (category) => api.get('/menu', { params: { category } }),
  createMenuItem: (data) => api.post('/menu', data),
  updateMenuItem: (id, data) => api.put(`/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/menu/${id}`),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Customer API functions
export const customerAPI = {
  getHotelByQR: (qrCode) => api.get(`/customer/hotel/${qrCode}`),
  login: (data) => api.post('/customer/login', data),
  getMenu: (hotelId, category) => api.get(`/customer/menu/${hotelId}`, { params: { category } }),
  getTables: (hotelId) => api.get(`/customer/tables/${hotelId}`),
  createOrder: (data) => api.post('/customer/orders', data),
  getOrders: (customerId) => api.get(`/customer/orders/${customerId}`),
  getOrder: (orderId) => api.get(`/customer/order/${orderId}`),
};

export default api;


