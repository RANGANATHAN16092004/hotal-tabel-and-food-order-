const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Inventory = require('../models/Inventory');
const MenuItem = require('../models/MenuItem');
const { createNotification } = require('../utils/notifications');

router.use(authMiddleware);

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find({ hotelId: req.hotelId })
      .populate('menuItemId', 'name category price')
      .sort({ stockQuantity: 1 });

    const lowStockItems = inventory.filter(item => item.isLowStock());

    res.json({
      success: true,
      count: inventory.length,
      inventory,
      lowStockCount: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Error fetching inventory', error: error.message });
  }
});

// Create or update inventory
router.post('/', [
  body('menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { menuItemId, stockQuantity, unit, lowStockThreshold, autoUnavailable } = req.body;

    const menuItem = await MenuItem.findOne({ _id: menuItemId, hotelId: req.hotelId });
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    let inventory = await Inventory.findOne({ hotelId: req.hotelId, menuItemId });

    if (inventory) {
      inventory.stockQuantity = stockQuantity;
      if (unit) inventory.unit = unit;
      if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
      if (autoUnavailable !== undefined) inventory.autoUnavailable = autoUnavailable;
    } else {
      inventory = new Inventory({
        hotelId: req.hotelId,
        menuItemId,
        stockQuantity,
        unit: unit || 'piece',
        lowStockThreshold: lowStockThreshold || 10,
        autoUnavailable: autoUnavailable || false
      });
    }

    await inventory.save();

    // Update menu item stock
    menuItem.stockQuantity = stockQuantity;
    await menuItem.save();

    // Check if low stock and send notification
    if (inventory.isLowStock()) {
      await createNotification({
        hotelId: req.hotelId,
        userId: req.hotelId,
        userType: 'hotel',
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `${menuItem.name} is running low (${stockQuantity} remaining)`,
        priority: 'high',
        data: { inventoryId: inventory._id, menuItemId }
      });
    }

    // Auto-unavailable if stock is 0
    if (autoUnavailable && stockQuantity === 0) {
      menuItem.available = false;
      await menuItem.save();
    }

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Error updating inventory', error: error.message });
  }
});

// Restock inventory
router.post('/:id/restock', [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { quantity, notes } = req.body;

    const inventory = await Inventory.findOne({ _id: req.params.id, hotelId: req.hotelId })
      .populate('menuItemId');

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    inventory.stockQuantity += quantity;
    inventory.lastRestocked = new Date();
    inventory.restockHistory.push({
      quantity,
      date: new Date(),
      notes: notes || ''
    });

    await inventory.save();

    // Update menu item
    const menuItem = await MenuItem.findById(inventory.menuItemId._id);
    if (menuItem) {
      menuItem.stockQuantity = inventory.stockQuantity;
      if (!menuItem.available && inventory.stockQuantity > 0) {
        menuItem.available = true;
      }
      await menuItem.save();
    }

    res.json({
      success: true,
      message: 'Inventory restocked successfully',
      inventory
    });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({ success: false, message: 'Error restocking inventory', error: error.message });
  }
});

module.exports = router;








