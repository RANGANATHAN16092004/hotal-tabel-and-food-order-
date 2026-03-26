const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Hotel = require('../models/Hotel');
const Customer = require('../models/Customer');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Otp = require('../models/Otp');
const Inventory = require('../models/Inventory');
const verifyHotelQr = require('../middleware/verifyQr');
const { sendCustomerSpendingReport } = require('../utils/email');

// Rate limiters
const hotelOrdersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => `${req.ip}-${req.params.hotelId || ''}`,
  standardHeaders: true,
  legacyHeaders: false
});

const orderNumberLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

// Helper: format currency in INR
const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  } catch (e) {
    return `₹${(amount || 0).toFixed(2)}`;
  }
};

const formatOrder = (orderDoc) => {
  if (!orderDoc) return orderDoc;
  const o = orderDoc.toObject ? orderDoc.toObject() : JSON.parse(JSON.stringify(orderDoc));
  o.totalAmountFormatted = formatCurrency(o.totalAmount);
  o.items = (o.items || []).map(item => ({
    ...item,
    priceFormatted: formatCurrency(item.price)
  }));
  return o;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// --- AUTH ROUTES ---

/**
 * @route   GET /api/customer/hotel/:qrCode
 * @desc    Get hotel info by QR code
 */
router.get('/hotel/:qrCode', async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ qrCode: req.params.qrCode }).select('-password');
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    res.json({
      success: true,
      hotel: {
        id: hotel._id,
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone,
        hourlyPoll: hotel.hourlyPoll,
        ecoGoal: hotel.ecoGoal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/customer/check-contact
 * @desc    Check if customer exists by email or phone
 */
router.get('/check-contact', async (req, res) => {
  try {
    const { contactInfo, hotelId } = req.query;
    if (!contactInfo || !hotelId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const isEmail = contactInfo.includes('@');
    const digits = contactInfo.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    // 1. Check if user already exists in THIS hotel
    const localQuery = { hotelId };
    if (isEmail) localQuery.email = contactInfo.toLowerCase();
    else localQuery.phone = { $regex: last10 + '$' };

    const localCustomer = await Customer.findOne(localQuery);
    if (localCustomer) {
      return res.json({
        success: true,
        exists: true,
        name: localCustomer.name
      });
    }

    // 2. If not in this hotel, find them ANYWHERE in the system to get their name
    const globalQuery = isEmail
      ? { email: contactInfo.toLowerCase() }
      : { phone: { $regex: last10 + '$' } };

    const globalCustomer = await Customer.findOne(globalQuery).sort({ createdAt: -1 });

    res.json({
      success: true,
      exists: false,
      name: globalCustomer ? globalCustomer.name : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/login
 * @desc    Customer register/login
 */
router.post('/login', [
  body('contactInfo').trim().notEmpty().withMessage('Contact info is required'),
  body('hotelId').notEmpty().withMessage('Hotel ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, contactInfo, hotelId } = req.body;
    const isEmail = contactInfo.includes('@');
    const query = { hotelId };

    if (isEmail) query.email = contactInfo.toLowerCase();
    else query.phone = contactInfo;

    let customer = await Customer.findOne(query);

    if (customer) {
      if (name && name !== customer.name) {
        customer.name = name;
        await customer.save();
      }
    } else {
      if (!name) return res.status(400).json({ success: false, message: 'Name is required for registration' });
      customer = new Customer({
        name,
        hotelId,
        [isEmail ? 'email' : 'phone']: isEmail ? contactInfo.toLowerCase() : contactInfo
      });
      await customer.save();
    }

    const token = generateToken(customer._id);
    res.json({
      success: true,
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        hotelId: customer.hotelId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// --- MENU & TABLES ---

/**
 * @route   GET /api/customer/menu/:hotelId
 * @desc    Public menu for a hotel (supports both hotel ObjectId and QR code)
 */
router.get('/menu/:hotelId', async (req, res) => {
  try {
    const { category } = req.query;
    const hotelIdOrQr = req.params.hotelId;
    let hotelFilterId = hotelIdOrQr;

    try {
      if (mongoose.Types.ObjectId.isValid(hotelIdOrQr)) {
        hotelFilterId = new mongoose.Types.ObjectId(hotelIdOrQr);
      } else {
        const hotel = await Hotel.findOne({ qrCode: hotelIdOrQr }).select('_id');
        if (!hotel) {
          return res.status(404).json({ success: false, message: 'Hotel not found for this code' });
        }
        hotelFilterId = hotel._id;
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid hotel identifier' });
    }

    const query = { hotelId: hotelFilterId, available: true };
    if (category) query.category = category;

    const [menuItems, categories] = await Promise.all([
      MenuItem.find(query).sort({ category: 1, name: 1 }),
      MenuItem.distinct('category', { hotelId: hotelFilterId, available: true })
    ]);

    res.json({ success: true, count: menuItems.length, categories, menuItems });
  } catch (error) {
    console.error('Customer menu fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu' });
  }
});

/**
 * @route   GET /api/customer/tables/:hotelId
 * @desc    Public tables for a hotel (supports both hotel ObjectId and QR code)
 */
router.get('/tables/:hotelId', async (req, res) => {
  try {
    const hotelIdOrQr = req.params.hotelId;
    let hotelFilterId = hotelIdOrQr;

    try {
      if (mongoose.Types.ObjectId.isValid(hotelIdOrQr)) {
        hotelFilterId = new mongoose.Types.ObjectId(hotelIdOrQr);
      } else {
        const hotel = await Hotel.findOne({ qrCode: hotelIdOrQr }).select('_id');
        if (!hotel) {
          return res.status(404).json({ success: false, message: 'Hotel not found for this code' });
        }
        hotelFilterId = hotel._id;
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid hotel identifier' });
    }

    const tables = await Table.find({ hotelId: hotelFilterId, status: 'available' }).sort({ tableNumber: 1 });
    res.json({ success: true, count: tables.length, tables });
  } catch (error) {
    console.error('Customer tables fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tables' });
  }
});

// --- ORDER ROUTES ---

/**
 * @route   POST /api/customer/orders
 * @desc    Create new order
 */
router.post('/orders', [
  body('customerId').notEmpty(),
  body('tableId').notEmpty(),
  body('items').isArray({ min: 1 })
], async (req, res) => {
  const io = req.app ? req.app.get('io') : null;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { customerId, tableId, items, couponCode, specialInstructions } = req.body;

    const [customer, table] = await Promise.all([
      Customer.findById(customerId),
      Table.findById(tableId)
    ]);

    if (!customer || !table) return res.status(404).json({ success: false, message: 'Customer or Table not found' });
    if (table.status !== 'available') return res.status(400).json({ success: false, message: 'Table is occupied' });

    let totalAmount = 0;
    let pointsEarned = 0;
    let pointsRedeemed = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.available) continue;

      if (item.isRedeemed) {
        const cost = (menuItem.pointsRequired || (menuItem.price * 10)) * item.quantity;
        pointsRedeemed += cost;
        orderItems.push({ ...item, price: 0, name: menuItem.name });
      } else {
        const lineTotal = menuItem.price * item.quantity;
        totalAmount += lineTotal;
        orderItems.push({ ...item, price: menuItem.price, name: menuItem.name });
      }

      // Stock management
      if (menuItem.stockQuantity !== null) {
        menuItem.stockQuantity = Math.max(0, menuItem.stockQuantity - item.quantity);
        await menuItem.save();

        // Sync with Inventory model
        const inv = await Inventory.findOne({ menuItemId: menuItem._id });
        if (inv) {
          inv.stockQuantity = menuItem.stockQuantity;
          await inv.save();
        }
      }
    }

    // Coupon Logic
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), hotelId: customer.hotelId });
      if (coupon && coupon.isValid() && totalAmount >= coupon.minOrderAmount) {
        discount = coupon.discountType === 'percentage'
          ? (totalAmount * coupon.discountValue) / 100
          : coupon.discountValue;
        coupon.usedCount++;
        await coupon.save();
      }
    }

    const finalAmount = Math.max(0, totalAmount - discount);

    // Calculate Reward Points: Sum up points for each item.
    // Use item-specific points if available, otherwise fallback to 1 point per ₹10 price.
    let totalPoints = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem && !item.isRedeemed) {
        const itemReward = (menuItem.pointsEarned > 0)
          ? menuItem.pointsEarned
          : Math.floor(menuItem.price / 10);
        totalPoints += (itemReward * item.quantity);
      }
    }
    pointsEarned = totalPoints;

    const order = new Order({
      hotelId: customer.hotelId,
      customerId,
      tableId,
      items: orderItems,
      totalAmount,
      discountAmount: discount,
      finalAmount,
      status: 'pending',
      pointsEarned,
      pointsRedeemed
    });

    await order.save();

    // Update Table & Customer
    table.status = 'occupied';
    await table.save();

    customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) + pointsEarned - pointsRedeemed);
    customer.orderHistory.push({
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.finalAmount,
      status: 'pending',
      date: new Date()
    });
    await customer.save();

    if (io) {
      io.to(`hotel-${customer.hotelId}`).emit('new-order', { orderNumber: order.orderNumber });
    }

    res.status(201).json({ success: true, order: formatOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/customer/orders/global/:identifier
 * @desc    Fetch all orders across all hotels by phone or email
 * NOTE: This MUST be before /orders/:customerId to avoid route conflict
 */
router.get('/orders/global/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isEmail = identifier.includes('@');
    const digits = identifier.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: { $regex: last10 + '$' } };

    const customers = await Customer.find(query);
    const customerIds = customers.map(c => c._id);

    const orders = await Order.find({ customerId: { $in: customerIds } })
      .populate('hotelId', 'name address phone')
      .populate('tableId', 'tableNumber')
      .sort({ orderDate: -1 });

    res.json({ success: true, orders: orders.map(formatOrder) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch global history' });
  }
});

/**
 * @route   GET /api/customer/visits/summary/:identifier
 * @desc    Hotel-grouped visit summary with per-hotel loyalty points
 * NOTE: This MUST be before /orders/:customerId to avoid route conflict
 */
router.get('/visits/summary/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const isEmail = identifier.includes('@');
    const digits = identifier.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: { $regex: last10 + '$' } };

    // Find all customer records across all hotels for this person
    const customers = await Customer.find(query).populate('hotelId', 'name address phone');
    const customerIds = customers.map(c => c._id);

    // Fetch all orders
    const allOrders = await Order.find({ customerId: { $in: customerIds } })
      .populate('hotelId', 'name address phone')
      .populate('tableId', 'tableNumber')
      .sort({ orderDate: -1 });

    // Build hotel-grouped summary
    const hotelMap = {};
    for (const customer of customers) {
      const hotelId = customer.hotelId?._id?.toString() || customer.hotelId?.toString();
      if (!hotelId) continue;
      hotelMap[hotelId] = {
        hotelId,
        hotelName: customer.hotelId?.name || 'Unknown Hotel',
        hotelAddress: customer.hotelId?.address || '',
        hotelPhone: customer.hotelId?.phone || '',
        loyaltyPoints: customer.loyaltyPoints || 0,
        customerId: customer._id,
        orders: [],
        totalSpent: 0,
        lastVisit: null
      };
    }

    // Attach orders to their hotel
    for (const order of allOrders) {
      const hotelId = order.hotelId?._id?.toString() || order.hotelId?.toString();
      if (hotelId && hotelMap[hotelId]) {
        hotelMap[hotelId].orders.push(formatOrder(order));
        hotelMap[hotelId].totalSpent += order.finalAmount || order.totalAmount || 0;
        const orderDate = new Date(order.orderDate);
        if (!hotelMap[hotelId].lastVisit || orderDate > new Date(hotelMap[hotelId].lastVisit)) {
          hotelMap[hotelId].lastVisit = order.orderDate;
        }
      }
    }

    const hotels = Object.values(hotelMap).sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit) - new Date(a.lastVisit);
    });

    res.json({ success: true, hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visit summary' });
  }
});

/**
 * @route   GET /api/customer/orders/:customerId
 */
router.get('/orders/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('hotelId', 'name address')
      .populate('tableId', 'tableNumber')
      .sort({ orderDate: -1 });
    res.json({ success: true, orders: orders.map(formatOrder) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});



/**
 * @route   GET /api/customer/order/:orderId
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('hotelId', 'name address phone')
      .populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: formatOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/customer/order/number/:orderNumber
 */
router.get('/order/number/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('hotelId', 'name address phone')
      .populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: formatOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- GLOBAL SEARCH & OTP (For Portal) ---

/**
 * @route   POST /api/customer/otp/send
 * @desc    Send OTP to phone/email for global lookup
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new Otp({
      phone: phone.replace(/\D/g, ''),
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await otp.save();

    console.info(`[DEVOPS] OTP for ${phone}: ${code}`);
    res.json({ success: true, message: 'OTP sent successfully (Check server logs in dev)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

/**
 * @route   POST /api/customer/otp/verify
 * @desc    Verify OTP and return all matching orders
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const digits = phone.replace(/\D/g, '');
    const otp = await Otp.findOne({ phone: digits, code }).sort({ createdAt: -1 });

    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    otp.verifiedAt = new Date();
    await otp.save();

    // Find all customers with this phone number across all hotels
    // Extract last 10 digits for consistent matching
    const last10 = digits.slice(-10);
    const customers = await Customer.find({ phone: { $regex: last10 + '$' } });
    const customerIds = customers.map(c => c._id);

    const orders = await Order.find({ customerId: { $in: customerIds } })
      .populate('hotelId', 'name address phone')
      .populate('items.menuItemId', 'name')
      .sort({ orderDate: -1 });

    res.json({ success: true, orders: orders.map(formatOrder) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

/**
 * @route   GET /api/customer/:id
 * @desc    Get customer profile with latest loyalty points
 */
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('hotelId', 'name address');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        hotelId: customer.hotelId,
        loyaltyPoints: customer.loyaltyPoints || 0,
        createdAt: customer.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/customer/:id/loyalty
 * @desc    Manually add/deduct loyalty points for a customer
 */
router.patch('/:id/loyalty', async (req, res) => {
  try {
    const { points, action } = req.body; // action: 'add' | 'deduct'
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (action === 'deduct') {
      customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - points);
    } else {
      customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
    }
    await customer.save();
    res.json({ success: true, loyaltyPoints: customer.loyaltyPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/customer/:id
 * @desc    Update customer profile details
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, email, profileImage, coverImage } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (name) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (profileImage !== undefined) customer.profileImage = profileImage;
    if (coverImage !== undefined) customer.coverImage = coverImage;

    await customer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        profileImage: customer.profileImage,
        coverImage: customer.coverImage,
        hotelId: customer.hotelId,
        loyaltyPoints: customer.loyaltyPoints || 0
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/:id/send-report
 * @desc    Generate and send spending report to customer email
 */
router.post('/:id/send-report', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.email) {
      return res.status(400).json({ success: false, message: 'Customer has no email address' });
    }

    // Fetch all completed orders for this customer
    const orders = await Order.find({ 
      customerId: customer._id,
      status: 'completed'
    }).sort({ orderDate: 1 });

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No completed orders found for this customer' });
    }

    let totalSpent = 0;
    const dailyDishStats = {};

    orders.forEach(order => {
      totalSpent += order.finalAmount || order.totalAmount || 0;
      const dateKey = new Date(order.orderDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (!dailyDishStats[dateKey]) {
        dailyDishStats[dateKey] = [];
      }

      order.items.forEach(item => {
        const dishIndex = dailyDishStats[dateKey].findIndex(d => d.name === item.name);
        if (dishIndex > -1) {
          dailyDishStats[dateKey][dishIndex].quantity += item.quantity;
          dailyDishStats[dateKey][dishIndex].spent += (item.price * item.quantity);
        } else {
          dailyDishStats[dateKey].push({
            name: item.name,
            quantity: item.quantity,
            spent: (item.price * item.quantity)
          });
        }
      });
    });

    const reportData = {
      customerName: customer.name,
      totalSpent,
      totalOrders: orders.length,
      dailyDishStats
    };

    const emailSent = await sendCustomerSpendingReport(customer.email, reportData);

    if (emailSent) {
      res.json({ success: true, message: 'Spending report sent to ' + customer.email });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/report/global
 * @desc    Generate and send global spending report across all hotels
 */
router.post('/report/global', async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Phone or Email required' });
    }

    const query = {};
    if (email) {
      query.email = email.toLowerCase();
    } else {
      const digits = phone.replace(/\D/g, '');
      const last10 = digits.slice(-10);
      query.phone = { $regex: last10 + '$' };
    }

    const customers = await Customer.find(query);
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'No customer records found' });
    }

    const targetEmail = email || customers.find(c => c.email)?.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'No email address found for this account' });
    }

    const customerIds = customers.map(c => c._id);
    const orders = await Order.find({ 
      customerId: { $in: customerIds },
      status: 'completed'
    }).sort({ orderDate: 1 });

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No completed orders found' });
    }

    let totalSpent = 0;
    const dailyDishStats = {};

    orders.forEach(order => {
      totalSpent += order.finalAmount || order.totalAmount || 0;
      const dateKey = new Date(order.orderDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (!dailyDishStats[dateKey]) {
        dailyDishStats[dateKey] = [];
      }

      order.items.forEach(item => {
        const dishIndex = dailyDishStats[dateKey].findIndex(d => d.name === item.name);
        if (dishIndex > -1) {
          dailyDishStats[dateKey][dishIndex].quantity += item.quantity;
          dailyDishStats[dateKey][dishIndex].spent += (item.price * item.quantity);
        } else {
          dailyDishStats[dateKey].push({
            name: item.name,
            quantity: item.quantity,
            spent: (item.price * item.quantity)
          });
        }
      });
    });

    const reportData = {
      customerName: customers[0].name, // Use the name from the first record
      totalSpent,
      totalOrders: orders.length,
      dailyDishStats
    };

    const emailSent = await sendCustomerSpendingReport(targetEmail, reportData);

    if (emailSent) {
      res.json({ success: true, message: 'Global spending report sent to ' + targetEmail });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Global report generation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- INTERACTIVE / GAMIFIED FEATURES ---

/**
 * @route   POST /api/customer/order/mystery
 * @desc    Generate a random order within budget
 */
router.post('/order/mystery', async (req, res) => {
  try {
    const { customerId, hotelId, tableId, budget } = req.body;
    const menuItems = await MenuItem.find({ hotelId, available: true, price: { $lte: budget }, isMerch: false });
    
    if (menuItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No items found within budget' });
    }

    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    const orderItems = [{
      menuItemId: randomItem._id,
      name: randomItem.name,
      quantity: 1,
      price: randomItem.price
    }];

    const newOrder = new Order({
      hotelId,
      customerId,
      tableId,
      items: orderItems,
      totalAmount: randomItem.price,
      isMysteryBox: true,
      status: 'pending'
    });

    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/gift
 * @desc    Send a gift to another table
 */
router.post('/gift', async (req, res) => {
  try {
    const { fromCustomerId, fromTableId, toTableNumber, menuItemId, hotelId } = req.body;
    const Table = require('../models/Table');
    const targetTable = await Table.findOne({ hotelId, tableNumber: toTableNumber });
    if (!targetTable) return res.status(404).json({ success: false, message: 'Target table not found' });

    const item = await MenuItem.findById(menuItemId);
    const orderItems = [{
      menuItemId: item._id,
      name: item.name,
      quantity: 1,
      price: item.price
    }];

    const giftOrder = new Order({
      hotelId,
      customerId: fromCustomerId,
      tableId: targetTable._id,
      items: orderItems,
      totalAmount: item.price,
      isGift: true,
      giftFromTable: fromTableId,
      status: 'pending'
    });

    await giftOrder.save();
    res.json({ success: true, message: 'Gift sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/poll/vote
 * @desc    Cast a vote in the hourly poll
 */
router.post('/poll/vote', async (req, res) => {
  try {
    const { hotelId, menuItemId } = req.body;
    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel.hourlyPoll) return res.status(400).json({ success: false, message: 'No active poll' });

    if (hotel.hourlyPoll.itemA?.toString() === menuItemId) {
      hotel.hourlyPoll.votesA += 1;
    } else if (hotel.hourlyPoll.itemB?.toString() === menuItemId) {
      hotel.hourlyPoll.votesB += 1;
    }

    await hotel.save();
    res.json({ success: true, poll: hotel.hourlyPoll });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/orders/roulette
 * @desc    Find a payer for the group bill roulette
 */
router.post('/orders/roulette', async (req, res) => {
  try {
    const { tableId, hotelId } = req.body;
    const activeOrders = await Order.find({ tableId, status: { $ne: 'completed' } }).populate('customerId');
    
    if (activeOrders.length < 2) return res.status(400).json({ success: false, message: 'Not enough players for Roulette' });

    const uniqueCustomers = Array.from(new Set(activeOrders.map(o => o.customerId?._id.toString())));
    const loserId = uniqueCustomers[Math.floor(Math.random() * uniqueCustomers.length)];
    const loserOrder = activeOrders.find(o => o.customerId?._id.toString() === loserId);
    
    res.json({ success: true, winner: loserOrder.customerId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/customer/reward/claim
 * @desc    Claim mystery reward points
 */
router.post('/reward/claim', async (req, res) => {
  try {
    const { customerId, points, hotelId } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
    await customer.save();
    res.json({ success: true, newPoints: customer.loyaltyPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
