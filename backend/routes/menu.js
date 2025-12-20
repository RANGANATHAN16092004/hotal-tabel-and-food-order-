const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const MenuItem = require('../models/MenuItem');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/menu
// @desc    Get all menu items for the hotel
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { hotelId: req.hotelId };
    
    if (category) {
      query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      count: menuItems.length,
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

// @route   POST /api/menu
// @desc    Create a new menu item
// @access  Private
router.post('/', [
  body('name').trim().notEmpty().withMessage('Menu item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description, price, category, image, available } = req.body;

    const menuItem = new MenuItem({
      hotelId: req.hotelId,
      name,
      description,
      price,
      category,
      image,
      available: available !== undefined ? available : true
    });

    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update a menu item
// @access  Private
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Menu item name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description, price, category, image, available } = req.body;

    const menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      hotelId: req.hotelId 
    });

    if (!menuItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    if (name) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price) menuItem.price = price;
    if (category) menuItem.category = category;
    if (image !== undefined) menuItem.image = image;
    if (available !== undefined) menuItem.available = available;

    await menuItem.save();

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      hotelId: req.hotelId 
    });

    if (!menuItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    await menuItem.deleteOne();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;


