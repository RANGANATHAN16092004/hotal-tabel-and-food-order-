const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Table = require('../models/Table');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/orders
// @desc    Get all orders for the hotel
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = { hotelId: req.hotelId };
    
    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: startDate, $lte: endDate };
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone')
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get a single order
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      hotelId: req.hotelId 
    })
      .populate('customerId', 'name phone')
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category image');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { status } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id, 
      hotelId: req.hotelId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    order.status = status;
    
    // Update table status based on order status
    const table = await Table.findById(order.tableId);
    if (table) {
      if (status === 'completed' || status === 'cancelled') {
        table.status = 'available';
      } else if (status === 'pending' || status === 'preparing' || status === 'ready') {
        table.status = 'occupied';
      }
      await table.save();
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone')
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;


