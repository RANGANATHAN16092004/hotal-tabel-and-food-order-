const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');

router.use(authMiddleware);

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = { hotelId: req.hotelId };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, message: 'Error fetching coupons', error: error.message });
  }
});

// Create coupon
router.post('/', [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0'),
  body('validFrom').isISO8601().withMessage('Valid from date is required'),
  body('validUntil').isISO8601().withMessage('Valid until date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      applicableTo,
      categories,
      menuItems,
      description
    } = req.body;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ hotelId: req.hotelId, code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      hotelId: req.hotelId,
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit || null,
      applicableTo: applicableTo || 'all',
      categories: categories || [],
      menuItems: menuItems || [],
      description
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
});

// Validate coupon (admin or customer; accepts optional hotelId for customer flows)
router.post('/validate', [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('orderAmount').isFloat({ min: 0 }).withMessage('Order amount is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code, orderAmount, hotelId, categories, menuItems } = req.body;

    let hotelFilterId = hotelId || req.hotelId;

    // Allow customer portals to send a hotel QR code instead of ObjectId
    if (hotelId && !hotelId.match(/^[0-9a-fA-F]{24}$/)) {
      const Hotel = require('../models/Hotel');
      const hotelDoc = await Hotel.findOne({ qrCode: hotelId }).select('_id');
      if (!hotelDoc) {
        return res.json({
          success: false,
          valid: false,
          message: 'Hotel not found for this code'
        });
      }
      hotelFilterId = hotelDoc._id;
    }

    const coupon = await Coupon.findOne({
      hotelId: hotelFilterId,
      code: code.toUpperCase()
    });

    if (!coupon) {
      return res.json({
        success: false,
        valid: false,
        message: 'Coupon code not found'
      });
    }

    if (!coupon.isValid()) {
      return res.json({
        success: false,
        valid: false,
        message: 'Coupon is not valid or has expired'
      });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.json({
        success: false,
        valid: false,
        message: `Minimum order amount of ${coupon.minOrderAmount} required`
      });
    }

    // Check applicability
    if (coupon.applicableTo === 'category' && categories) {
      const hasMatchingCategory = categories.some(cat => coupon.categories.includes(cat));
      if (!hasMatchingCategory) {
        return res.json({
          success: false,
          valid: false,
          message: 'Coupon not applicable to selected items'
        });
      }
    }

    if (coupon.applicableTo === 'item' && menuItems) {
      const hasMatchingItem = menuItems.some(item => coupon.menuItems.includes(item));
      if (!hasMatchingItem) {
        return res.json({
          success: false,
          valid: false,
          message: 'Coupon not applicable to selected items'
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, orderAmount);

    res.json({
      success: true,
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount,
      finalAmount: orderAmount - discountAmount
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: 'Error validating coupon', error: error.message });
  }
});

// Apply coupon (increment usage)
router.post('/:id/apply', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid' });
    }

    coupon.usedCount += 1;
    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: 'Error applying coupon', error: error.message });
  }
});

// Update coupon
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const {
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
      description
    } = req.body;

    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (validFrom) coupon.validFrom = new Date(validFrom);
    if (validUntil) coupon.validUntil = new Date(validUntil);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (description !== undefined) coupon.description = description;

    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Error updating coupon', error: error.message });
  }
});

// Delete coupon
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Error deleting coupon', error: error.message });
  }
});

module.exports = router;








