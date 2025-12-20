const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Hotel = require('../models/Hotel');
const { generateQRCode } = require('../utils/qrGenerator');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new hotel
// @access  Public
router.post('/register', [
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

    // Create new hotel
    const hotel = new Hotel({
      name,
      email,
      password,
      phone,
      address
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
        qrCode: hotel.qrCode
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

module.exports = router;


