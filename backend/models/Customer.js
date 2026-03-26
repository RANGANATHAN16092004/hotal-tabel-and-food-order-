const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  orderHistory: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    orderNumber: {
      type: String
    },
    items: [{
      name: { type: String },
      quantity: { type: Number },
      price: { type: Number }
    }],
    totalAmount: { type: Number },
    status: { type: String },
    date: { type: Date }
  }],
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  preferences: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPreferences',
    sparse: true
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Partial unique indexes to ensure uniqueness only when field is present
customerSchema.index({ hotelId: 1, phone: 1 }, {
  unique: true,
  partialFilterExpression: { phone: { $type: "string" } }
});
customerSchema.index({ hotelId: 1, email: 1 }, {
  unique: true,
  partialFilterExpression: { email: { $type: "string" } }
});

module.exports = mongoose.model('Customer', customerSchema);
