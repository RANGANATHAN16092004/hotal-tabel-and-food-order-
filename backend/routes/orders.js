const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Hotel = require('../models/Hotel');
const { notifyOrderStatusChange } = require('../utils/notifications');
const { sendOrderReceipt } = require('../utils/email');

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

    const { status, paymentMethod } = req.body;

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

    // If status changed to cancelled, reverse loyalty points
    if (status === 'cancelled' && order.status !== 'cancelled') {
      try {
        const customer = await Customer.findById(order.customerId);
        if (customer) {
          // Return redeemed points and remove earned points
          customer.loyaltyPoints = (customer.loyaltyPoints || 0) - (order.pointsEarned || 0) + (order.pointsRedeemed || 0);
          if (customer.loyaltyPoints < 0) customer.loyaltyPoints = 0;

          // Update history entry
          const hist = customer.orderHistory.find(h => h.orderId && h.orderId.toString() === order._id.toString());
          if (hist) {
            hist.status = 'cancelled';
          }
          await customer.save();
          console.info(`Reversed points for cancelled order ${order.orderNumber}. New balance: ${customer.loyaltyPoints}`);
        }
      } catch (err) {
        console.error('Failed to reverse points for cancelled order:', err);
      }
    } else {
      // Just update status in history for non-cancellation updates
      try {
        const customer = await Customer.findById(order.customerId);
        if (customer) {
          const hist = customer.orderHistory.find(h => h.orderId && h.orderId.toString() === order._id.toString());
          if (hist) {
            hist.status = status;
            await customer.save();
          }
        }
      } catch (err) {
        console.error('Failed to update customer orderHistory:', err);
      }
    }

    order.status = status;

    // Save payment method if provided
    if (paymentMethod && ['cash', 'card', 'upi', 'online', 'offline'].includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
      // Also update payment status if marking as completed
      if (status === 'completed') {
        order.paymentStatus = 'paid';
      }
    }

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

    // Emit WebSocket event
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      io.to(`hotel-${req.hotelId}`).emit('order-updated', {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      });
      io.to(`customer-${updatedOrder.customerId._id}`).emit('order-status-changed', {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      });
    }

    // Send notification & Email Receipt
    try {
      const customer = await Customer.findById(order.customerId);
      const hotel = await Hotel.findById(req.hotelId);
      if (customer && hotel) {
        await notifyOrderStatusChange(updatedOrder, customer, hotel);
        
        // Auto-send email receipt if completed
        if (status === 'completed' && customer.email) {
            await sendOrderReceipt(customer.email, {
                orderNumber: updatedOrder.orderNumber,
                hotelName: hotel.name,
                items: updatedOrder.items,
                totalAmount: updatedOrder.totalAmount,
                discountAmount: updatedOrder.discountAmount,
                finalAmount: updatedOrder.finalAmount,
                date: new Date(updatedOrder.orderDate).toLocaleDateString()
            });
            console.info(`Auto-receipt sent to ${customer.email} for order ${updatedOrder.orderNumber}`);
        }
      }
    } catch (err) {
      console.error('Failed to send notification or receipt:', err);
    }

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





