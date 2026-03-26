// Admin authentication helpers
export const adminAuth = {
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  setAdmin: (admin) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_profile', JSON.stringify(admin));
    }
  },
  getAdmin: () => {
    if (typeof window !== 'undefined') {
      const admin = localStorage.getItem('admin_profile');
      return admin ? JSON.parse(admin) : null;
    }
    return null;
  },
  removeAdmin: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_profile');
    }
  },
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },
};

// Customer authentication helpers
export const customerAuth = {
  setCustomer: (customer) => {
    if (typeof window !== 'undefined') {
      // Preserve existing session fields (like sessionQrCode and hotelId)
      // so that navigating between pages doesn't break the QR-based session.
      const existing = localStorage.getItem('customer');
      let merged = customer;
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          merged = { ...parsed, ...customer };
        } catch {
          merged = customer;
        }
      }
      localStorage.setItem('customer', JSON.stringify(merged));
    }
  },
  getCustomer: () => {
    if (typeof window !== 'undefined') {
      const customer = localStorage.getItem('customer');
      return customer ? JSON.parse(customer) : null;
    }
    return null;
  },
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_token', token);
    }
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customer_token');
    }
    return null;
  },
  removeCustomer: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer');
      localStorage.removeItem('customer_token');
    }
  },
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('customer');
    }
    return false;
  },
  isValidSession: (hotelId) => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('customer');
    if (!saved) return false;
    try {
      const customer = JSON.parse(saved);
      // Flexible match against DB ID or QR string
      const isMatch = customer.hotelId === hotelId || customer.sessionQrCode === hotelId;

      // Proactive update: if it matches by DB ID but QR code is different/missing, update it
      if (customer.hotelId === hotelId && customer.sessionQrCode !== hotelId) {
        customer.sessionQrCode = hotelId;
        localStorage.setItem('customer', JSON.stringify(customer));
      }

      return isMatch;
    } catch (e) {
      return false;
    }
  },
  saveLastCustomerInfo: (info) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_customer_info', JSON.stringify(info));
    }
  },
  getLastCustomerInfo: () => {
    if (typeof window !== 'undefined') {
      const info = localStorage.getItem('last_customer_info');
      return info ? JSON.parse(info) : null;
    }
    return null;
  },
};













