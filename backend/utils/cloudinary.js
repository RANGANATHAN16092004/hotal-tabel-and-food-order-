const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Upload image to Cloudinary
const uploadImage = async (filePath, folder = 'restaurant') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // If Cloudinary not configured, return local path
    return filePath;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
      resource_type: 'image'
    });
    
    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Return local path as fallback
    return filePath;
  }
};

// Delete image from Cloudinary
const deleteImage = async (imageUrl) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !imageUrl) {
    return;
  }

  try {
    // Extract public_id from URL
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};








