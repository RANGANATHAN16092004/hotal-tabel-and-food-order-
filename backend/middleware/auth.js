const jwt = require('jsonwebtoken');
const Hotel = require('../models/Hotel');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a hotel token or a staff token
    if (decoded.id) {
      // Hotel Admin token
      const hotel = await Hotel.findById(decoded.id).select('-password');
      if (!hotel) {
        return res.status(401).json({ success: false, message: 'Token is not valid' });
      }
      req.hotel = hotel;
      req.hotelId = hotel._id;
      req.userType = 'hotel';
    } else if (decoded.staffId) {
      // Staff token
      req.staffId = decoded.staffId;
      req.hotelId = decoded.hotelId;
      req.role = decoded.role;
      req.userType = 'staff';
    } else {
      return res.status(401).json({ success: false, message: 'Token structure is not valid' });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = authMiddleware;









