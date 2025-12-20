const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Hotel = require('../models/Hotel');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');

// @route   GET /api/customer/hotel/:qrCode
// @desc    Get hotel info by QR code
// @access  Public
router.get('/hotel/:qrCode', async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ qrCode: req.params.qrCode }).select('-password');
    
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }

    res.json({
      success: true,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone
      }
    });
  } catch (error) {
    console.error('Get hotel by QR error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   POST /api/customer/login
// @desc    Customer login (name + phone)
// @access  Public
router.post('/login', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('hotelId').notEmpty().withMessage('Hotel ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, phone, hotelId } = req.body;

    // Verify hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hotel not found' 
      });
    }

    // Find or create customer
    let customer = await Customer.findOne({ hotelId, phone });
    
    if (customer) {
      // Update name if provided
      if (name) {
        customer.name = name;
        await customer.save();
      }
    } else {
      // Create new customer
      customer = new Customer({
        name,
        phone,
        hotelId
      });
      await customer.save();
    }

    res.json({
      success: true,
      message: 'Login successful',
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        hotelId: customer.hotelId
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered for this hotel' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/customer/menu/:hotelId
// @desc    Get menu items for a hotel
// @access  Public
router.get('/menu/:hotelId', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { 
      hotelId: req.params.hotelId,
      available: true 
    };
    
    if (category) {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query)
      .sort({ category: 1, name: 1 })
      .select('-hotelId');

    // Get unique categories
    const categories = await MenuItem.distinct('category', { 
      hotelId: req.params.hotelId,
      available: true 
    });

    res.json({
      success: true,
      count: menuItems.length,
      categories,
      menuItems
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/customer/tables/:hotelId
// @desc    Get available tables for a hotel
// @access  Public
router.get('/tables/:hotelId', async (req, res) => {
  try {
    const tables = await Table.find({ 
      hotelId: req.params.hotelId,
      status: 'available'
    })
      .sort({ tableNumber: 1 })
      .select('-hotelId -qrCode');

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

// @route   POST /api/customer/orders
// @desc    Create a new order
// @access  Public
router.post('/orders', [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('tableId').notEmpty().withMessage('Table ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { customerId, tableId, items } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Verify table exists and is available
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }

    if (table.status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: 'Table is not available' 
      });
    }

    // Verify table belongs to same hotel as customer
    if (table.hotelId.toString() !== customer.hotelId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Table does not belong to this hotel' 
      });
    }

    // Fetch menu items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      
      if (!menuItem) {
        return res.status(404).json({ 
          success: false, 
          message: `Menu item ${item.menuItemId} not found` 
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({ 
          success: false, 
          message: `Menu item ${menuItem.name} is not available` 
        });
      }

      if (menuItem.hotelId.toString() !== customer.hotelId.toString()) {
        return res.status(400).json({ 
          success: false, 
          message: `Menu item ${menuItem.name} does not belong to this hotel` 
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order
    const order = new Order({
      hotelId: customer.hotelId,
      customerId,
      tableId,
      items: orderItems,
      totalAmount,
      status: 'pending'
    });

    await order.save();

    // Update table status
    table.status = 'occupied';
    await table.save();

    // Add order to customer's orders array
    customer.orders.push(order._id);
    await customer.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category image');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/customer/orders/:customerId
// @desc    Get customer order history
// @access  Public
router.get('/orders/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category image')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/customer/order/:orderId
// @desc    Get a single order
// @access  Public
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
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

module.exports = router;


