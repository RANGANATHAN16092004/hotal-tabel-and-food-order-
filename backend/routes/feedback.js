const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const { createNotification } = require('../utils/notifications');

// Create feedback (public)
router.post('/', [
  body('type').isIn(['complaint', 'suggestion', 'compliment', 'general']).withMessage('Invalid feedback type'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { hotelId, customerId, orderId, type, subject, message, priority } = req.body;

    const feedback = new Feedback({
      hotelId,
      customerId,
      orderId,
      type,
      subject,
      message,
      priority: priority || (type === 'complaint' ? 'high' : 'medium'),
      status: 'open'
    });

    await feedback.save();

    // Notify hotel
    if (hotelId) {
      await createNotification({
        hotelId,
        userId: hotelId,
        userType: 'hotel',
        type: 'feedback',
        title: `New ${type}: ${subject}`,
        message: message.substring(0, 100),
        priority: feedback.priority,
        data: { feedbackId: feedback._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ success: false, message: 'Error submitting feedback', error: error.message });
  }
});

// Get feedback (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const query = { hotelId: req.hotelId };

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const feedback = await Feedback.find(query)
      .populate('customerId', 'name phone')
      .populate('orderId', 'orderNumber')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, message: 'Error fetching feedback', error: error.message });
  }
});

// Update feedback status/response
router.put('/:id', authMiddleware, [
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  body('response').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, response, priority } = req.body;

    const feedback = await Feedback.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (status) feedback.status = status;
    if (response) {
      feedback.response = response;
      feedback.respondedBy = req.hotelId;
      feedback.respondedAt = new Date();
    }
    if (priority) feedback.priority = priority;

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ success: false, message: 'Error updating feedback', error: error.message });
  }
});

module.exports = router;

