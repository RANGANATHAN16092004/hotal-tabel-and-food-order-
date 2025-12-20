const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Table capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  qrCode: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique table numbers per hotel
tableSchema.index({ hotelId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);


