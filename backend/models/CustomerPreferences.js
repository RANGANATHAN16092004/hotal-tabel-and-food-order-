const mongoose = require('mongoose');

const customerPreferencesSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  favoriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  dietaryPreferences: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  }],
  allergies: [{
    type: String
  }],
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true
  },
  referralCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

customerPreferencesSchema.index({ hotelId: 1, customerId: 1 });

module.exports = mongoose.model('CustomerPreferences', customerPreferencesSchema);








