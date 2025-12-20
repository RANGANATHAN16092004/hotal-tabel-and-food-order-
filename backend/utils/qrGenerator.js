const QRCode = require('qrcode');

/**
 * Generate QR code image data URL
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} - Data URL of QR code image
 */
const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    return qrDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code buffer
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<Buffer>} - Buffer of QR code image
 */
const generateQRCodeBuffer = async (data) => {
  try {
    const qrBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });
    return qrBuffer;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer
};


