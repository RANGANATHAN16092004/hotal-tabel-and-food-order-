const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/tables
// @desc    Get all tables for the hotel
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find({ hotelId: req.hotelId }).sort({ tableNumber: 1 });

    res.json({
      success: true,
      count: tables.length,
      tables
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/tables
// @desc    Create a new table
// @access  Private
router.post('/', [
  body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tableNumber, capacity, status } = req.body;

    // Check if table number already exists for this hotel
    const existingTable = await Table.findOne({
      hotelId: req.hotelId,
      tableNumber
    });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }

    const table = new Table({
      hotelId: req.hotelId,
      tableNumber,
      capacity,
      status: status || 'available'
    });

    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      table
    });
  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/tables/:id
// @desc    Update a table
// @access  Private
router.put('/:id', [
  body('tableNumber').optional().trim().notEmpty().withMessage('Table number cannot be empty'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tableNumber, capacity, status } = req.body;

    const table = await Table.findOne({
      _id: req.params.id,
      hotelId: req.hotelId
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (tableNumber && tableNumber !== table.tableNumber) {
      // Check if new table number already exists
      const existingTable = await Table.findOne({
        hotelId: req.hotelId,
        tableNumber,
        _id: { $ne: req.params.id }
      });

      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: 'Table number already exists'
        });
      }
      table.tableNumber = tableNumber;
    }

    if (capacity) table.capacity = capacity;
    if (status) table.status = status;

    await table.save();

    res.json({
      success: true,
      message: 'Table updated successfully',
      table
    });
  } catch (error) {
    console.error('Update table error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete a table
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findOne({
      _id: req.params.id,
      hotelId: req.hotelId
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table has active orders
    const Order = require('../models/Order');
    const activeOrders = await Order.find({
      tableId: req.params.id,
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table with active orders'
      });
    }

    await table.deleteOne();

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/tables/:id/layout
// @desc    Update a table's layout position
// @access  Private
router.put('/:id/layout', async (req, res) => {
  try {
    const { layout } = req.body;
    const table = await Table.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.x = layout.x;
    table.y = layout.y;
    await table.save();

    res.json({ success: true, table });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;













