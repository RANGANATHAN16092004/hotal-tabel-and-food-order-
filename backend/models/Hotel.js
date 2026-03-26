const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  logo: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cuisine: [{
    type: String
  }],
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
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    sparse: true
  },
  allowedIPs: [{
    type: String
  }],
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  secondaryEmails: [{
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  }],
  hourlyPoll: {
    itemA: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    itemB: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    votesA: { type: Number, default: 0 },
    votesB: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    expiresAt: { type: Date }
  },
  ecoGoal: {
    targetScore: { type: Number, default: 90 },
    currentScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Hash password before saving
hotelSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate unique QR code identifier
hotelSchema.methods.generateQRCode = function() {
  const crypto = require('crypto');
  this.qrCode = crypto.randomBytes(16).toString('hex');
  return this.qrCode;
};

// Compare password method
hotelSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Hotel', hotelSchema);





