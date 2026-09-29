const QRCode = require('qrcode');

/**
 * Generate a QR code base64 string for a player
 * @param {Object} player Player document or data
 * @returns {Promise<string>} base64 image data URL
 */
const generatePlayerQR = async (player) => {
  try {
    const payload = {
      id: player._id ? player._id.toString() : player.id,
      name: player.name,
      rollNumber: player.rollNumber,
      departmentId: player.department ? player.department.toString() : ''
    };

    // Generate base64 data URL png
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#1e293b', // Slate 800
        light: '#ffffff' // White
      }
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating player QR code:', error);
    throw new Error('Failed to generate player credential QR code');
  }
};

module.exports = {
  generatePlayerQR
};
