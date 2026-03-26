# Setup Guide for New Features

## Installation

1. **Install new backend dependencies**:
```bash
cd backend
npm install
```

2. **Update environment variables** in `backend/.env`:
```env
# Payment (Optional - for online payments)
STRIPE_SECRET_KEY=sk_test_...

# Image Upload (Optional - for cloud storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# WebSocket (Already configured via FRONTEND_URL)
FRONTEND_URL=http://localhost:3000
```

3. **Create upload directories**:
```bash
mkdir -p backend/uploads/menu
mkdir -p backend/uploads/hotel
mkdir -p backend/uploads/receipts
mkdir -p backend/uploads/kitchen
```

## Frontend Integration

### 1. Install Socket.IO Client

```bash
cd frontend
npm install socket.io-client
```

### 2. Create WebSocket Hook

Create `frontend/lib/socket.js`:
```javascript
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
let socket = null;

export const connectSocket = (userId, userType) => {
  if (socket) return socket;

  socket = io(API_URL.replace('/api', ''));

  socket.on('connect', () => {
    console.log('Connected to server');
    if (userType === 'hotel') {
      socket.emit('join-hotel', userId);
    } else if (userType === 'customer') {
      socket.emit('join-customer', userId);
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
```

### 3. Update API Library

Add new API methods to `frontend/lib/api.js`:

```javascript
// Payments
export const createPaymentIntent = (orderId, amount) => 
  axios.post('/api/payments/create-intent', { orderId, amount });

export const confirmPayment = (orderId, paymentMethod, amount, transactionId) =>
  axios.post('/api/payments/confirm', { orderId, paymentMethod, amount, transactionId });

// Reviews
export const getReviews = (hotelId, type) =>
  axios.get(`/api/reviews/hotel/${hotelId}`, { params: { type } });

export const createReview = (orderId, rating, comment, type, menuItemId) =>
  axios.post('/api/reviews', { orderId, rating, comment, type, menuItemId });

// Reservations
export const getReservations = (date, status) =>
  axios.get('/api/reservations', { params: { date, status } });

export const createReservation = (data) =>
  axios.post('/api/reservations', data);

export const getAvailableSlots = (tableId, date) =>
  axios.get('/api/reservations/available-slots', { params: { tableId, date } });

// Coupons
export const getCoupons = () =>
  axios.get('/api/coupons');

export const validateCoupon = (code, orderAmount, hotelId) =>
  axios.post('/api/coupons/validate', { code, orderAmount, hotelId });

// Inventory
export const getInventory = () =>
  axios.get('/api/inventory');

export const updateInventory = (data) =>
  axios.post('/api/inventory', data);

// Analytics
export const getAnalytics = (startDate, endDate) =>
  axios.get('/api/analytics/dashboard', { params: { startDate, endDate } });

// Notifications
export const getNotifications = (userId, userType, read) =>
  axios.get('/api/notifications', { params: { userId, userType, read } });

export const markNotificationRead = (id) =>
  axios.put(`/api/notifications/${id}/read`);

// Image Upload
export const uploadMenuImage = (file) => {
  const formData = new FormData();
  formData.append('menuImage', file);
  return axios.post('/api/uploads/menu', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// And more...
```

## Usage Examples

### Real-time Order Updates (Admin)

```javascript
'use client';
import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const hotelId = 'your-hotel-id';

  useEffect(() => {
    const socket = connectSocket(hotelId, 'hotel');

    socket.on('new-order', (data) => {
      // Refresh orders or add new order
      fetchOrders();
    });

    socket.on('order-updated', (data) => {
      // Update order status
      setOrders(prev => prev.map(order => 
        order._id === data.orderId 
          ? { ...order, status: data.status }
          : order
      ));
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
    };
  }, []);

  // ... rest of component
}
```

### Payment Integration

```javascript
import { createPaymentIntent, confirmPayment } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

async function handlePayment(orderId, amount) {
  try {
    // Create payment intent
    const { data } = await createPaymentIntent(orderId, amount);
    
    // Initialize Stripe
    const stripe = await stripePromise;
    const { error } = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (error) {
      console.error(error);
      return;
    }

    // Confirm payment
    await confirmPayment(orderId, 'card', amount, data.paymentIntentId);
  } catch (error) {
    console.error('Payment error:', error);
  }
}
```

### Image Upload

```javascript
async function handleImageUpload(file) {
  try {
    const formData = new FormData();
    formData.append('menuImage', file);
    
    const { data } = await axios.post('/api/uploads/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return data.imageUrl;
  } catch (error) {
    console.error('Upload error:', error);
  }
}
```

## Testing

1. **Test WebSocket connection**:
   - Open admin dashboard
   - Place an order from customer portal
   - Verify real-time notification appears

2. **Test payment flow**:
   - Create an order
   - Initiate payment
   - Complete payment
   - Verify order status updates

3. **Test image upload**:
   - Upload menu item image
   - Verify image appears in menu

4. **Test reservations**:
   - Create a reservation
   - Verify time slot is blocked
   - Test status updates

## Notes

- All new routes follow RESTful conventions
- Authentication is required for admin routes
- WebSocket events are automatically emitted on relevant actions
- Notifications are sent when configured (email/SMS)
- All models include proper validation








