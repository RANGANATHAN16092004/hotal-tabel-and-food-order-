const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  reservationDate: {
    type: Date,
    required: true
  },
  reservationTime: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  specialRequests: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

reservationSchema.index({ hotelId: 1, reservationDate: 1, reservationTime: 1 });
reservationSchema.index({ tableId: 1, reservationDate: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);








