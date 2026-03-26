const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    sparse: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableTo: {
    type: String,
    enum: ['all', 'category', 'item'],
    default: 'all'
  },
  categories: [{
    type: String
  }],
  menuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  description: {
    type: String
  }
}, {
  timestamps: true
});

couponSchema.index({ hotelId: 1, code: 1 }, { unique: true });
couponSchema.index({ hotelId: 1, isActive: 1, validFrom: 1, validUntil: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive &&
         this.validFrom <= now &&
         this.validUntil >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
};

module.exports = mongoose.model('Coupon', couponSchema);








