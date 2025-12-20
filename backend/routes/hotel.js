const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Hotel = require('../models/Hotel');
const { generateQRCode } = require('../utils/qrGenerator');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/hotel/profile
// @desc    Get hotel profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId).select('-password');
    
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }

    res.json({
      success: true,
      hotel
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/hotel/profile
// @desc    Update hotel profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }

    if (name) hotel.name = name;
    if (phone) hotel.phone = phone;
    if (address !== undefined) hotel.address = address;

    await hotel.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/hotel/qr
// @desc    Get hotel QR code
// @access  Private
router.get('/qr', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId).select('-password');
    
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }

    // Generate QR code if not exists
    if (!hotel.qrCode) {
      hotel.generateQRCode();
      await hotel.save();
    }

    // Generate QR code image
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrData = `${frontendUrl}/${hotel.qrCode}`;
    const qrImage = await generateQRCode(qrData);

    res.json({
      success: true,
      qrCode: hotel.qrCode,
      qrImage,
      qrUrl: qrData
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;


