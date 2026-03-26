const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const CustomerPreferences = require('../models/CustomerPreferences');
const Hotel = require('../models/Hotel');

// @route   GET /api/recommendations/:customerId
// @desc    Get personalized menu recommendations
// @access  Public (or Private with auth)
router.get('/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { hotelId } = req.query;

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID is required' });
        }

        // Resolve hotelId (could be ObjectId or QR code)
        let hotelFilterId = hotelId;
        if (mongoose.Types.ObjectId.isValid(hotelId)) {
            hotelFilterId = new mongoose.Types.ObjectId(hotelId);
        } else {
            const hotelRecord = await Hotel.findOne({ qrCode: hotelId }).select('_id');
            if (!hotelRecord) {
                return res.status(404).json({ success: false, message: 'Hotel not found' });
            }
            hotelFilterId = hotelRecord._id;
        }

        // 1. Get customer preferences
        const preferences = await CustomerPreferences.findOne({ customerId });

        // 2. Get customer order history
        const pastOrders = await Order.find({ customerId })
            .populate('items.menuItemId')
            .sort({ orderDate: -1 })
            .limit(10);

        // 3. Extract favorite categories
        let favoriteCategories = [];
        if (pastOrders.length > 0) {
            const categories = pastOrders.flatMap(order =>
                order.items.map(item => item.menuItemId?.category)
            ).filter(Boolean);

            // Count frequencies
            const counts = categories.reduce((acc, cat) => {
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            favoriteCategories = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
        }

        // 4. Build query filters
        const filter = {
            hotelId: hotelFilterId,
            available: true
        };

        // Applying dietary restrictions
        if (preferences) {
            if (preferences.dietary?.vegetarian) {
                filter.dietaryInfo = { $in: ['vegetarian'] };
            } else if (preferences.dietary?.vegan) {
                filter.dietaryInfo = { $in: ['vegan'] };
            }

            if (preferences.dietary?.allergies?.length > 0) {
                const allergyRegex = preferences.dietary.allergies.map(a => new RegExp(a, 'i'));
                filter.$and = filter.$and || [];
                filter.$and.push({
                    $or: [
                        { name: { $nin: allergyRegex } },
                        { description: { $nin: allergyRegex } }
                    ]
                });
            }
        }

        // 5. Fetch potential recommendations
        let recommendations = [];

        // Strategy A: items in favorite categories they haven't ordered recently
        if (favoriteCategories.length > 0) {
            recommendations = await MenuItem.find({
                ...filter,
                category: { $in: favoriteCategories.slice(0, 2) }
            }).limit(5);
        }

        // Strategy B: Top rated / Popular items if not enough recs
        if (recommendations.length < 3) {
            const popularItems = await MenuItem.find(filter)
                .sort({ averageRating: -1, reviewCount: -1 })
                .limit(5);

            // Merge and remove duplicates
            const existingIds = new Set(recommendations.map(r => r._id.toString()));
            popularItems.forEach(item => {
                if (!existingIds.has(item._id.toString())) {
                    recommendations.push(item);
                }
            });
        }

        res.json({
            success: true,
            recommendations: recommendations.slice(0, 6)
        });
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
    }
});

module.exports = router;
