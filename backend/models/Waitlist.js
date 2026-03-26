const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 30
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'seated', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  position: {
    type: Number,
    required: true
  },
  notifiedAt: {
    type: Date
  },
  seatedAt: {
    type: Date
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    sparse: true
  },
  specialRequests: {
    type: String
  }
}, {
  timestamps: true
});

waitlistSchema.index({ hotelId: 1, status: 1, createdAt: 1 });
waitlistSchema.index({ hotelId: 1, position: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);








