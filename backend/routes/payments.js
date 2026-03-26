const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// All routes require authentication
router.use(authMiddleware);

// Create payment intent (Stripe)
router.post('/create-intent', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, amount } = req.body;

    const order = await Order.findOne({ _id: orderId, hotelId: req.hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: orderId.toString(),
        hotelId: req.hotelId.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, message: 'Error creating payment intent', error: error.message });
  }
});

// Confirm payment
router.post('/confirm', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, paymentMethod, amount, transactionId, gatewayResponse } = req.body;

    const order = await Order.findOne({ _id: orderId, hotelId: req.hotelId })
      .populate('customerId');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = new Payment({
      orderId,
      hotelId: req.hotelId,
      customerId: order.customerId._id,
      amount,
      paymentMethod,
      paymentStatus: 'completed',
      paymentGateway: paymentMethod === 'cash' ? 'cash' : 'stripe',
      transactionId,
      gatewayResponse,
      paidAt: new Date()
    });

    await payment.save();

    // Update order
    order.paymentStatus = 'paid';
    order.paymentId = payment._id;
    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      payment
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ success: false, message: 'Error confirming payment', error: error.message });
  }
});

// Get payment by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = await Payment.findOne({ orderId: req.params.orderId })
      .populate('customerId', 'name phone');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, message: 'Error fetching payment', error: error.message });
  }
});

// Refund payment
router.post('/refund/:paymentId', [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, reason } = req.body;

    const payment = await Payment.findOne({ _id: req.params.paymentId, hotelId: req.hotelId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const refundAmount = amount || payment.amount;

    // Process refund through gateway if applicable
    if (payment.paymentGateway === 'stripe' && payment.transactionId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(refundAmount * 100)
        });
        payment.gatewayResponse = { refund: refund.id };
      } catch (error) {
        console.error('Stripe refund error:', error);
      }
    }

    payment.paymentStatus = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    await payment.save();

    // Update order
    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'refunded';
      await order.save();
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      payment
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, message: 'Error processing refund', error: error.message });
  }
});

module.exports = router;








