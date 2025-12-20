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
      localStorage.setItem('customer', JSON.stringify(customer));
    }
  },
  getCustomer: () => {
    if (typeof window !== 'undefined') {
      const customer = localStorage.getItem('customer');
      return customer ? JSON.parse(customer) : null;
    }
    return null;
  },
  removeCustomer: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer');
    }
  },
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('customer');
    }
    return false;
  },
};


