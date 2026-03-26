const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: null // null means unlimited
  },
  dietaryInfo: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  }],
  allergens: [{
    type: String
  }],
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  spiceLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  pointsRequired: {
    type: Number,
    default: 0, // 0 means not redeemable via points
    min: 0
  },
  pointsEarned: {
    type: Number,
    default: 0, // points granted when purchased
    min: 0
  },
  happyHourPrice: {
    type: Number,
    min: 0
  },
  happyHourStartTime: {
    type: String, // format "HH:mm"
    default: "16:00"
  },
  happyHourEndTime: {
    type: String, // format "HH:mm"
    default: "18:00"
  },
  ecoScore: {
    type: Number, // 1-100 where 100 is most sustainable
    min: 1,
    max: 100,
    default: 80
  },
  isMerch: {
    type: Boolean, // True if item is physical merchandise (t-shirt, etc.)
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);



