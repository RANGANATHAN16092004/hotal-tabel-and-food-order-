const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadMenuImage, uploadHotelImages } = require('../utils/upload');
const { uploadImage } = require('../utils/cloudinary');
const MenuItem = require('../models/MenuItem');
const Hotel = require('../models/Hotel');
const path = require('path');

router.use(authMiddleware);

// Upload menu item image
router.post('/menu', uploadMenuImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let imageUrl = req.file.path;
    
    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      imageUrl = await uploadImage(req.file.path, 'menu');
    } else {
      // Return relative URL for local storage
      imageUrl = `/uploads/menu/${path.basename(req.file.path)}`;
    }

    res.json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Upload hotel logo and cover
router.post('/hotel', uploadHotelImages, async (req, res) => {
  try {
    const images = {};
    
    if (req.files.hotelLogo && req.files.hotelLogo[0]) {
      let logoUrl = req.files.hotelLogo[0].path;
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        logoUrl = await uploadImage(req.files.hotelLogo[0].path, 'hotel');
      } else {
        logoUrl = `/uploads/hotel/${path.basename(req.files.hotelLogo[0].path)}`;
      }
      images.logo = logoUrl;
    }

    if (req.files.hotelCover && req.files.hotelCover[0]) {
      let coverUrl = req.files.hotelCover[0].path;
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        coverUrl = await uploadImage(req.files.hotelCover[0].path, 'hotel');
      } else {
        coverUrl = `/uploads/hotel/${path.basename(req.files.hotelCover[0].path)}`;
      }
      images.cover = coverUrl;
    }

    // Update hotel with images
    const hotel = await Hotel.findById(req.hotelId);
    if (images.logo) hotel.logo = images.logo;
    if (images.cover) hotel.coverImage = images.cover;
    await hotel.save();

    res.json({
      success: true,
      images,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

module.exports = router;








