const express = require('express');
const router = express.Router();
const CustomerPreferences = require('../models/CustomerPreferences');
const Customer = require('../models/Customer');
const crypto = require('crypto');

// Get customer preferences
router.get('/:customerId', async (req, res) => {
  try {
    const preferences = await CustomerPreferences.findOne({ customerId: req.params.customerId })
      .populate('favoriteItems', 'name price image category');

    if (!preferences) {
      return res.json({
        success: true,
        preferences: null
      });
    }

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, message: 'Error fetching preferences', error: error.message });
  }
});

// Create or update preferences
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      hotelId,
      favoriteItems,
      dietaryPreferences,
      allergies,
      preferredLanguage
    } = req.body;

    let preferences = await CustomerPreferences.findOne({ customerId });

    if (preferences) {
      if (favoriteItems) preferences.favoriteItems = favoriteItems;
      if (dietaryPreferences) preferences.dietaryPreferences = dietaryPreferences;
      if (allergies) preferences.allergies = allergies;
      if (preferredLanguage) preferences.preferredLanguage = preferredLanguage;
    } else {
      // Generate referral code
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      preferences = new CustomerPreferences({
        customerId,
        hotelId,
        favoriteItems: favoriteItems || [],
        dietaryPreferences: dietaryPreferences || [],
        allergies: allergies || [],
        preferredLanguage: preferredLanguage || 'en',
        referralCode
      });
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Error updating preferences', error: error.message });
  }
});

// Add to favorites
router.post('/favorites', async (req, res) => {
  try {
    const { customerId, menuItemId } = req.body;

    let preferences = await CustomerPreferences.findOne({ customerId });

    if (!preferences) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      preferences = new CustomerPreferences({
        customerId,
        hotelId: customer.hotelId,
        favoriteItems: [menuItemId],
        referralCode
      });
    } else {
      if (!preferences.favoriteItems.includes(menuItemId)) {
        preferences.favoriteItems.push(menuItemId);
      }
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Added to favorites',
      preferences
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, message: 'Error adding favorite', error: error.message });
  }
});

// Remove from favorites
router.delete('/favorites/:customerId/:menuItemId', async (req, res) => {
  try {
    const preferences = await CustomerPreferences.findOne({ customerId: req.params.customerId });

    if (!preferences) {
      return res.status(404).json({ success: false, message: 'Preferences not found' });
    }

    preferences.favoriteItems = preferences.favoriteItems.filter(
      id => id.toString() !== req.params.menuItemId
    );

    await preferences.save();

    res.json({
      success: true,
      message: 'Removed from favorites',
      preferences
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, message: 'Error removing favorite', error: error.message });
  }
});

// Update loyalty points
router.post('/loyalty', async (req, res) => {
  try {
    const { customerId, points, action } = req.body; // action: 'add' or 'subtract'

    let preferences = await CustomerPreferences.findOne({ customerId });

    if (!preferences) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      preferences = new CustomerPreferences({
        customerId,
        hotelId: customer.hotelId,
        loyaltyPoints: action === 'add' ? points : 0
      });
    } else {
      if (action === 'add') {
        preferences.loyaltyPoints += points;
      } else if (action === 'subtract') {
        preferences.loyaltyPoints = Math.max(0, preferences.loyaltyPoints - points);
      }
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Loyalty points updated',
      preferences
    });
  } catch (error) {
    console.error('Update loyalty error:', error);
    res.status(500).json({ success: false, message: 'Error updating loyalty points', error: error.message });
  }
});

module.exports = router;








