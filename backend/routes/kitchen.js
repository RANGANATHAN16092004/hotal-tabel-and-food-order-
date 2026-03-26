const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Kitchen display system - get active orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      hotelId: req.hotelId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('tableId', 'tableNumber')
      .populate('items.menuItemId', 'name category preparationTime')
      .sort({ orderDate: 1 });

    // Calculate elapsed time and estimated completion
    const ordersWithTiming = orders.map(order => {
      const elapsedMinutes = Math.floor((new Date() - new Date(order.orderDate)) / 60000);
      const maxPrepTime = Math.max(...order.items.map(item =>
        item.menuItemId?.preparationTime || 15
      ));
      const estimatedCompletion = new Date(order.orderDate);
      estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + maxPrepTime);

      return {
        ...order.toObject(),
        elapsedMinutes,
        estimatedCompletion,
        isOverdue: elapsedMinutes > maxPrepTime
      };
    });

    res.json({
      success: true,
      count: ordersWithTiming.length,
      orders: ordersWithTiming
    });
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching kitchen orders', error: error.message });
  }
});

// Get order details for kitchen
router.get('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      hotelId: req.hotelId
    })
      .populate('tableId', 'tableNumber capacity')
      .populate('items.menuItemId', 'name category preparationTime image')
      .populate('customerId', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const elapsedMinutes = Math.floor((new Date() - new Date(order.orderDate)) / 60000);
    const maxPrepTime = Math.max(...order.items.map(item =>
      item.menuItemId?.preparationTime || 15
    ));

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        elapsedMinutes,
        estimatedPrepTime: maxPrepTime,
        isOverdue: elapsedMinutes > maxPrepTime
      }
    });
  } catch (error) {
    console.error('Get kitchen order error:', error);
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
});

// Group orders by category for kitchen display
router.get('/orders-by-category', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      hotelId: req.hotelId,
      status: { $in: ['pending', 'preparing'] }
    })
      .populate('tableId', 'tableNumber')
      .populate('items.menuItemId', 'name category')
      .sort({ orderDate: 1 });

    const groupedByCategory = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItemId?.category || 'Other';
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }
        groupedByCategory[category].push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableId?.tableNumber,
          itemName: item.name,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          orderDate: order.orderDate
        });
      });
    });

    res.json({
      success: true,
      groupedOrders: groupedByCategory
    });
  } catch (error) {
    console.error('Get orders by category error:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
});

// Update item status in order
// Update item status in order
router.put('/orders/:orderId/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId, itemId } = req.params;

    if (!['pending', 'preparing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        hotelId: req.hotelId,
        'items._id': itemId
      },
      {
        $set: { 'items.$.status': status }
      },
      { new: true, runValidators: false } // Skip full document validation to prevent unrelated errors
    )
      .populate('tableId', 'tableNumber')
      .populate('items.menuItemId', 'name category');

    if (!order) {
      // Debugging help: determine why it failed
      const debugOrder = await Order.findById(orderId);
      let reason = 'Order not found';
      if (debugOrder) {
        if (debugOrder.hotelId.toString() !== req.hotelId.toString()) reason = 'Hotel ID Mismatch';
        else if (!debugOrder.items.find(i => i._id.toString() === itemId)) reason = `Item ${itemId} not found in Order`;
        else reason = 'Unknown Database Error';
      }
      return res.status(404).json({
        success: false,
        message: `Update Failed: ${reason} (O:${orderId?.slice(-4)} I:${itemId?.slice(-4)})`
      });
    }

    res.json({
      success: true,
      message: 'Item status updated',
      order
    });
  } catch (error) {
    console.error('Update kitchen item status error:', error);
    res.status(500).json({ success: false, message: 'Error updating item status', error: error.message });
  }
});

module.exports = router;








