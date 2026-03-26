const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Hotel = require('../models/Hotel');
const { generateQRCode } = require('../utils/qrGenerator');

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const crypto = require('crypto');
const { sendOTP } = require('../utils/email');

const { uploadHotelImages } = require('../utils/upload');
const { uploadImage } = require('../utils/cloudinary');
const path = require('path');

// @route   POST /api/auth/register
// @desc    Register a new hotel
// @access  Public
router.post('/register', uploadHotelImages, [
  body('name').trim().notEmpty().withMessage('Hotel name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if hotel already exists
    const existingHotel = await Hotel.findOne({ email });
    if (existingHotel) {
      return res.status(400).json({
        success: false,
        message: 'Hotel with this email already exists'
      });
    }

    // Handle image upload
    let logoUrl = null;
    if (req.files && req.files.hotelLogo && req.files.hotelLogo[0]) {
      const file = req.files.hotelLogo[0];
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        logoUrl = await uploadImage(file.path, 'hotel');
      } else {
        logoUrl = `/uploads/hotel/${path.basename(file.path)}`;
      }
    }

    // Create new hotel
    const hotel = new Hotel({
      name,
      email,
      password,
      phone,
      address,
      logo: logoUrl
    });

    // Generate QR code
    hotel.generateQRCode();
    await hotel.save();

    // Generate token
    const token = generateToken(hotel._id);

    res.status(201).json({
      success: true,
      message: 'Hotel registered successfully',
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        qrCode: hotel.qrCode,
        logo: hotel.logo
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login hotel
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find hotel by email
    const hotel = await Hotel.findOne({ email });
    if (!hotel) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await hotel.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate QR code if not exists
    if (!hotel.qrCode) {
      hotel.generateQRCode();
      await hotel.save();
    }

    // Generate token
    const token = generateToken(hotel._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        qrCode: hotel.qrCode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const { email } = req.body;
    const hotel = await Hotel.findOne({ email });

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Generate an OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    hotel.otp = await bcrypt.hash(otp, 10);
    hotel.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await hotel.save();

    // Send OTP email
    await sendOTP(hotel.email, otp);

    res.json({
      success: true,
      message: 'OTP sent to your registered email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and reset password
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;
    const hotel = await Hotel.findOne({ email }).select('+otp +otpExpires');

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    if (!hotel.otp || !hotel.otpExpires || Date.now() > hotel.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    }

    const isMatch = await bcrypt.compare(otp, hotel.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Reset password
    hotel.password = newPassword;
    hotel.otp = undefined;
    hotel.otpExpires = undefined;
    await hotel.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

module.exports = router;









