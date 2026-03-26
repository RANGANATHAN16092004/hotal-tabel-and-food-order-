const Hotel = require('../models/Hotel');

// Middleware to verify hotel's QR code. Checks header 'x-hotel-qr' or query param 'qr'.
module.exports = async function verifyHotelQr(req, res, next) {
  try {
    const providedQr = req.header('x-hotel-qr') || req.query.qr || req.body.qr;
    if (!providedQr) {
      return res.status(401).json({ success: false, message: 'Missing hotel QR token' });
    }

    const hotelId = req.params.hotelId;
    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'Missing hotel id' });
    }

    const hotel = await Hotel.findById(hotelId).select('qrCode');
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    if (!hotel.qrCode || providedQr !== hotel.qrCode) {
      return res.status(403).json({ success: false, message: 'Invalid hotel QR token' });
    }

    // attach hotel info to request for later use
    req.hotel = hotel;
    next();
  } catch (err) {
    console.error('verifyHotelQr error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};