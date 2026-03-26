const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const Table = require('../models/Table');
const { sendSMSNotification, createNotification } = require('../utils/notifications');

// Get waitlist (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { hotelId: req.hotelId };

    if (status) {
      query.status = status;
    }

    const waitlist = await Waitlist.find(query)
      .populate('tableId', 'tableNumber capacity')
      .sort({ position: 1, createdAt: 1 });

    res.json({
      success: true,
      count: waitlist.length,
      waitlist
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ success: false, message: 'Error fetching waitlist', error: error.message });
  }
});

// Add to waitlist (customer)
router.post('/', [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { customerName, phone, numberOfGuests, specialRequests, hotelId } = req.body;

    // Get current max position
    const maxPosition = await Waitlist.findOne({ hotelId, status: 'waiting' })
      .sort({ position: -1 })
      .select('position');

    const position = (maxPosition?.position || 0) + 1;

    // Estimate wait time (30 minutes per group ahead)
    const estimatedWaitTime = (position - 1) * 30;

    const waitlistEntry = new Waitlist({
      hotelId,
      customerName,
      phone,
      numberOfGuests,
      specialRequests,
      position,
      estimatedWaitTime,
      status: 'waiting'
    });

    await waitlistEntry.save();

    // Broadcast waitlist update
    const io = req.app.get('io');
    if (io) {
      io.to(`hotel-${hotelId}`).emit('waitlist-updated', {
        type: 'new_entry',
        waitlistId: waitlistEntry._id
      });
    }

    // Notify admin
    await createNotification({
      hotelId,
      userId: hotelId,
      userType: 'hotel',
      type: 'system',
      title: 'New Waitlist Entry',
      message: `${customerName} added to waitlist (${numberOfGuests} guests)`,
      data: { waitlistId: waitlistEntry._id }
    });

    res.status(201).json({
      success: true,
      message: 'Added to waitlist successfully',
      waitlist: waitlistEntry
    });
  } catch (error) {
    console.error('Add to waitlist error:', error);
    res.status(500).json({ success: false, message: 'Error adding to waitlist', error: error.message });
  }
});

// Update waitlist status
router.put('/:id/status', authMiddleware, [
  body('status').isIn(['waiting', 'notified', 'seated', 'cancelled', 'no_show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, tableId } = req.body;

    const waitlistEntry = await Waitlist.findOne({ _id: req.params.id, hotelId: req.hotelId });

    if (!waitlistEntry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }

    waitlistEntry.status = status;

    if (status === 'notified') {
      waitlistEntry.notifiedAt = new Date();
    } else if (status === 'seated') {
      waitlistEntry.seatedAt = new Date();
      if (tableId) {
        waitlistEntry.tableId = tableId;
        const table = await Table.findById(tableId);
        if (table) {
          table.status = 'occupied';
          await table.save();
        }
      }

      // Recalculate positions for remaining entries
      await Waitlist.updateMany(
        { hotelId: req.hotelId, status: 'waiting', position: { $gt: waitlistEntry.position } },
        { $inc: { position: -1 } }
      );
    }

    await waitlistEntry.save();

    // Broadcast waitlist update
    const io = req.app.get('io');
    if (io) {
      io.to(`hotel-${req.hotelId}`).emit('waitlist-updated', {
        type: 'status_change',
        waitlistId: waitlistEntry._id,
        status: waitlistEntry.status,
        customerPhone: waitlistEntry.phone
      });
    }

    // Send SMS notification
    if (status === 'notified' || status === 'seated') {
      const messages = {
        notified: `Your table is ready! Please proceed to the restaurant.`,
        seated: `You have been seated. Enjoy your meal!`
      };
      if (messages[status]) {
        await sendSMSNotification(waitlistEntry.phone, messages[status]);
      }
    }

    res.json({
      success: true,
      message: 'Waitlist status updated',
      waitlist: waitlistEntry
    });
  } catch (error) {
    console.error('Update waitlist error:', error);
    res.status(500).json({ success: false, message: 'Error updating waitlist', error: error.message });
  }
});

// Get estimated wait time
router.get('/estimate', async (req, res) => {
  try {
    const { hotelId, numberOfGuests } = req.query;

    const waitingCount = await Waitlist.countDocuments({
      hotelId,
      status: 'waiting'
    });

    const estimatedWaitTime = waitingCount * 30; // 30 minutes per group

    res.json({
      success: true,
      estimatedWaitTime,
      positionInQueue: waitingCount + 1
    });
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ success: false, message: 'Error getting estimate', error: error.message });
  }
});

// Get customer's waitlist status
router.get('/status', async (req, res) => {
  try {
    const { hotelId, phone } = req.query;

    if (!hotelId || !phone) {
      return res.status(400).json({ success: false, message: 'HotelId and phone are required' });
    }

    const entry = await Waitlist.findOne({
      hotelId,
      phone,
      status: { $in: ['waiting', 'notified'] }
    }).sort({ createdAt: -1 });

    if (!entry) {
      return res.json({ success: true, entry: null });
    }

    res.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Get waitlist status error:', error);
    res.status(500).json({ success: false, message: 'Error fetching status' });
  }
});

module.exports = router;








