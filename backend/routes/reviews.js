const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Hotel = require('../models/Hotel');

// Get reviews for hotel (supports hotel ObjectId or QR code)
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { type, menuItemId, limit = 50 } = req.query;
    const hotelIdOrQr = req.params.hotelId;

    // Resolve either a direct hotel ObjectId or a QR code string
    let hotelFilterId = hotelIdOrQr;
    try {
      if (!hotelIdOrQr.match(/^[0-9a-fA-F]{24}$/)) {
        const hotel = await Hotel.findOne({ qrCode: hotelIdOrQr }).select('_id');
        if (!hotel) {
          return res.status(404).json({ success: false, message: 'Hotel not found for this code' });
        }
        hotelFilterId = hotel._id;
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid hotel identifier' });
    }

    const query = { hotelId: hotelFilterId };

    if (type) query.type = type;
    if (menuItemId) query.menuItemId = menuItemId;

    const reviews = await Review.find(query)
      .populate('customerId', 'name')
      .populate('menuItemId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const averageRating = await Review.aggregate([
      { $match: { hotelId: hotelFilterId, type: 'restaurant' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      reviews,
      averageRating: averageRating[0]?.avgRating || 0,
      totalReviews: averageRating[0]?.count || 0
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
});

// Create review
router.post('/', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('type').optional().isIn(['restaurant', 'menu_item', 'order'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, rating, comment, type = 'order', menuItemId } = req.body;

    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('hotelId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId, customerId: order.customerId._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Review already exists for this order' });
    }

    const review = new Review({
      hotelId: order.hotelId._id,
      customerId: order.customerId._id,
      orderId,
      menuItemId,
      rating,
      comment,
      type,
      verified: true // Verified if order exists
    });

    await review.save();

    // Update hotel/menu item ratings
    if (type === 'restaurant') {
      const hotelReviews = await Review.find({ hotelId: order.hotelId._id, type: 'restaurant' });
      const avgRating = hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length;
      await Hotel.findByIdAndUpdate(order.hotelId._id, {
        averageRating: avgRating,
        reviewCount: hotelReviews.length
      });
    } else if (type === 'menu_item' && menuItemId) {
      const itemReviews = await Review.find({ menuItemId, type: 'menu_item' });
      const avgRating = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
      await MenuItem.findByIdAndUpdate(menuItemId, {
        averageRating: avgRating,
        reviewCount: itemReviews.length
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
});

// Get reviews for admin (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, menuItemId, limit = 50 } = req.query;
    const query = { hotelId: req.hotelId };

    if (type) query.type = type;
    if (menuItemId) query.menuItemId = menuItemId;

    const reviews = await Review.find(query)
      .populate('customerId', 'name')
      .populate('menuItemId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
});

// Respond to review (admin only)
router.put('/:id/respond', authMiddleware, [
  body('response').trim().notEmpty().withMessage('Response is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const review = await Review.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.response = req.body.response;
    review.responseDate = new Date();
    await review.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ success: false, message: 'Error responding to review', error: error.message });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      review
    });
  } catch (error) {
    console.error('Helpful review error:', error);
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
});

module.exports = router;




