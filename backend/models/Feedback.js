const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    sparse: true
  },
  type: {
    type: String,
    enum: ['complaint', 'suggestion', 'compliment', 'general'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  response: {
    type: String,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    sparse: true
  },
  respondedAt: {
    type: Date
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

feedbackSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);








