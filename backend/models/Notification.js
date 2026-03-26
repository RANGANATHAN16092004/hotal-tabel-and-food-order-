const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    sparse: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userType: {
    type: String,
    enum: ['hotel', 'staff', 'customer'],
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'reservation', 'payment', 'review', 'feedback', 'inventory', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ hotelId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);








