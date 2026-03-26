const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    default: 'piece'
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  autoUnavailable: {
    type: Boolean,
    default: false
  },
  lastRestocked: {
    type: Date
  },
  restockHistory: [{
    quantity: Number,
    date: Date,
    notes: String
  }]
}, {
  timestamps: true
});

inventorySchema.index({ hotelId: 1, menuItemId: 1 }, { unique: true });
inventorySchema.index({ hotelId: 1, stockQuantity: 1 });

// Method to check if stock is low
inventorySchema.methods.isLowStock = function() {
  return this.stockQuantity <= this.lowStockThreshold;
};

module.exports = mongoose.model('Inventory', inventorySchema);








