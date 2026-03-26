const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  modifications: [{
    type: String,
    trim: true
  }],
  dietaryNotes: [{
    type: String
  }],
  isRedeemed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'plating', 'completed', 'cancelled'],
    default: 'pending'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'Table ID is required']
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  isMysteryBox: {
    type: Boolean,
    default: false
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftFromTable: {
    type: String, // Table number or ID
    default: null
  },
  isBillRoulette: {
    type: Boolean,
    default: false
  },
  roulettePayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  platingPhoto: {
    type: String, // URL to the snapping photo
    default: null
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    sparse: true
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    sparse: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online', 'offline'],
    default: null,
    sparse: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    sparse: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  estimatedPrepTime: {
    type: Number, // in minutes
    default: 30
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate a unique incremental orderNumber using Counter
orderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderNumber = `ORD${String(counter.seq).padStart(8, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Calculate finalAmount before saving
orderSchema.pre('save', function (next) {
  if (this.isModified('totalAmount') || this.isModified('discountAmount') || this.isNew) {
    this.finalAmount = (this.totalAmount || 0) - (this.discountAmount || 0);
    if (this.finalAmount < 0) this.finalAmount = 0;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);





