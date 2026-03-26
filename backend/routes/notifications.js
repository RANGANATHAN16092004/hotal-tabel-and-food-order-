const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get notifications (for hotel, staff, or customer)
router.get('/', async (req, res) => {
  try {
    const { userId, userType, read, limit = 50 } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({ success: false, message: 'User ID and type are required' });
    }

    const query = { userId, userType };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, userType, read: false });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ success: false, message: 'User ID and type are required' });
    }

    await Notification.updateMany(
      { userId, userType, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Error deleting notification', error: error.message });
  }
});

module.exports = router;








