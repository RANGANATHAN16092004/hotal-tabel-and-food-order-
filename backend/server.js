const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-booking';

console.log('Initiating MongoDB connection...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🚀 MongoDB Connected Successfully');
    console.log(`Connected to: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('TIP: If using MongoDB Atlas, ensure your IP address is whitelisted in the Atlas Network Access panel.');
  });

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hotel', require('./routes/hotel'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/kitchen', require('./routes/kitchen'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-hotel', (hotelId) => {
    socket.join(`hotel-${hotelId}`);
    console.log(`Socket ${socket.id} joined hotel-${hotelId}`);
  });

  socket.on('join-customer', (customerId) => {
    socket.join(`customer-${customerId}`);
    console.log(`Socket ${socket.id} joined customer-${customerId}`);
  });

  socket.on('join-table', (tableId) => {
    socket.join(`table-${tableId}`);
    console.log(`Socket ${socket.id} joined table-${tableId}`);
  });

  socket.on('update-cart', (data) => {
    // Broadcast cart updates to everyone at the same table except the sender
    socket.to(`table-${data.tableId}`).emit('cart-synced', {
      cart: data.cart,
      updatedBy: data.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




