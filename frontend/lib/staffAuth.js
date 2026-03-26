export const staffAuth = {
    setToken: (token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('staff_token', token);
        }
    },
    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('staff_token');
        }
        return null;
    },
    removeToken: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('staff_token');
            localStorage.removeItem('staff_profile');
        }
    },
    setStaff: (staff) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('staff_profile', JSON.stringify(staff));
        }
    },
    getStaff: () => {
        if (typeof window !== 'undefined') {
            const staff = localStorage.getItem('staff_profile');
            return staff ? JSON.parse(staff) : null;
        }
        return null;
    },
    isAuthenticated: () => {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('staff_token');
        }
        return false;
    },
};
