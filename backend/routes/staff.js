const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Staff = require('../models/Staff');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');

// Staff login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, hotelId } = req.body;

    // Validate hotelId format
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ success: false, message: 'Invalid Hotel Identifier format' });
    }

    const staff = await Staff.findOne({ email, hotelId, isActive: true });
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    staff.lastLogin = new Date();
    await staff.save();

    // Log activity
    await ActivityLog.create({
      hotelId: staff.hotelId,
      userId: staff._id,
      userType: 'staff',
      action: 'login',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    const token = jwt.sign(
      { staffId: staff._id, hotelId: staff.hotelId, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
});

// Get current staff profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffId).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    res.json({
      success: true,
      staff
    });
  } catch (error) {
    console.error('Get staff profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
});

// Get all staff (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.find({ hotelId: req.hotelId }).select('-password');

    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff', error: error.message });
  }
});

// Create staff
router.post('/', authMiddleware, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['manager', 'waiter', 'chef', 'cashier', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, role, permissions } = req.body;

    const existingStaff = await Staff.findOne({ email, hotelId: req.hotelId });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Staff with this email already exists' });
    }

    const staff = new Staff({
      hotelId: req.hotelId,
      name,
      email,
      phone,
      password,
      role,
      permissions: permissions || []
    });

    await staff.save();

    // Log activity
    await ActivityLog.create({
      hotelId: req.hotelId,
      userId: req.hotelId,
      userType: 'hotel',
      action: 'create_staff',
      entityType: 'staff',
      entityId: staff._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Error creating staff', error: error.message });
  }
});

// Update staff
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, role, permissions, isActive, shiftSchedule } = req.body;

    const staff = await Staff.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    if (name) staff.name = name;
    if (phone) staff.phone = phone;
    if (role) staff.role = role;
    if (permissions) staff.permissions = permissions;
    if (isActive !== undefined) staff.isActive = isActive;
    if (shiftSchedule) staff.shiftSchedule = shiftSchedule;

    await staff.save();

    res.json({
      success: true,
      message: 'Staff updated successfully',
      staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Error updating staff', error: error.message });
  }
});

// Delete staff
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    await staff.deleteOne();

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Error deleting staff', error: error.message });
  }
});

module.exports = router;








