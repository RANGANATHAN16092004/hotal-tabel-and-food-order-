const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { sendSMSNotification, createNotification } = require('../utils/notifications');

// Get reservations (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = { hotelId: req.hotelId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.reservationDate = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('customerId', 'name phone')
      .populate('tableId', 'tableNumber capacity')
      .sort({ reservationDate: 1, reservationTime: 1 });

    res.json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reservations', error: error.message });
  }
});

// Create reservation (customer)
router.post('/', [
  body('tableId').notEmpty().withMessage('Table ID is required'),
  body('reservationDate').notEmpty().withMessage('Reservation date is required'),
  body('reservationTime').notEmpty().withMessage('Reservation time is required'),
  body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
  body('contactName').trim().notEmpty().withMessage('Contact name is required'),
  body('contactPhone').trim().notEmpty().withMessage('Contact phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tableId, reservationDate, reservationTime, numberOfGuests, specialRequests, contactName, contactPhone, hotelId, customerId } = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (numberOfGuests > table.capacity) {
      return res.status(400).json({ success: false, message: 'Number of guests exceeds table capacity' });
    }

    // Check for conflicting reservations
    const conflictingReservation = await Reservation.findOne({
      tableId,
      reservationDate: new Date(reservationDate),
      reservationTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingReservation) {
      return res.status(400).json({ success: false, message: 'Table already reserved for this time' });
    }

    const reservation = new Reservation({
      hotelId: hotelId || table.hotelId,
      customerId,
      tableId,
      reservationDate: new Date(reservationDate),
      reservationTime,
      numberOfGuests,
      specialRequests,
      contactName,
      contactPhone,
      status: 'pending'
    });

    await reservation.save();

    // Emit WebSocket event
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      io.to(`hotel-${reservation.hotelId}`).emit('new-reservation', {
        reservationId: reservation._id,
        contactName: reservation.contactName,
        time: reservation.reservationTime
      });
    }

    // Update table status
    table.status = 'reserved';
    await table.save();

    // Send notification
    if (hotelId) {
      await createNotification({
        hotelId,
        userId: hotelId,
        userType: 'hotel',
        type: 'reservation',
        title: 'New Reservation',
        message: `New reservation for table ${table.tableNumber} at ${reservationTime}`,
        data: { reservationId: reservation._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ success: false, message: 'Error creating reservation', error: error.message });
  }
});

// Update reservation status
router.put('/:id/status', authMiddleware, [
  body('status').isIn(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status } = req.body;

    const reservation = await Reservation.findOne({ _id: req.params.id, hotelId: req.hotelId })
      .populate('customerId');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    reservation.status = status;

    if (status === 'cancelled') {
      reservation.cancelledAt = new Date();
      const table = await Table.findById(reservation.tableId);
      if (table) {
        table.status = 'available';
        await table.save();
      }
    } else if (status === 'seated') {
      reservation.seatedAt = new Date();
      const table = await Table.findById(reservation.tableId);
      if (table) {
        table.status = 'occupied';
        await table.save();
      }
    }

    await reservation.save();

    // Emit WebSocket event
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      io.to(`hotel-${req.hotelId}`).emit('reservation-status-updated', {
        reservationId: reservation._id,
        status: reservation.status
      });
      if (reservation.customerId) {
        io.to(`customer-${reservation.customerId._id || reservation.customerId}`).emit('reservation-status-updated', {
          reservationId: reservation._id,
          status: reservation.status
        });
      }
    }

    // Send SMS notification
    if (reservation.customerId && reservation.customerId.phone) {
      const messages = {
        confirmed: 'Your reservation has been confirmed.',
        seated: 'You have been seated. Enjoy your meal!',
        cancelled: 'Your reservation has been cancelled.'
      };
      if (messages[status]) {
        await sendSMSNotification(reservation.customerId.phone, messages[status]);
      }
    }

    res.json({
      success: true,
      message: 'Reservation status updated',
      reservation
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ success: false, message: 'Error updating reservation', error: error.message });
  }
});

// Get available time slots
router.get('/available-slots', async (req, res) => {
  try {
    const { tableId, date } = req.query;

    if (!tableId || !date) {
      return res.status(400).json({ success: false, message: 'Table ID and date are required' });
    }

    const reservations = await Reservation.find({
      tableId,
      reservationDate: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });

    // Generate time slots (every 30 minutes from 11 AM to 10 PM)
    const slots = [];
    for (let hour = 11; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    const bookedSlots = reservations.map(r => r.reservationTime);
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      availableSlots,
      bookedSlots
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ success: false, message: 'Error fetching slots', error: error.message });
  }
});

// Get customer reservations
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    const query = { customerId };
    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('tableId', 'tableNumber capacity')
      .populate('hotelId', 'name address phone')
      .sort({ reservationDate: -1, reservationTime: -1 });

    res.json({
      success: true,
      count: reservations.length,
      reservations
    });
  } catch (error) {
    console.error('Get customer reservations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reservations', error: error.message });
  }
});

module.exports = router;




