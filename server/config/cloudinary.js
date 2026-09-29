const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary initialized successfully.');
} else {
  console.log('Cloudinary credentials missing. Falling back to local storage uploads.');
}

/**
 * Uploads a file to Cloudinary or falls back to server local directory.
 * @param {string} localFilePath Path to the temporary file on local disk
 * @param {string} folder Target folder name on Cloudinary
 * @returns {Promise<{ url: string, public_id: string }>} Upload result metadata
 */
const uploadImage = async (localFilePath, folder = 'nec-sports') => {
  try {
    if (!localFilePath) return null;

    if (isCloudinaryConfigured) {
      const response = await cloudinary.uploader.upload(localFilePath, {
        folder: folder,
        resource_type: 'auto'
      });
      
      // Remove local temp file after upload
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      
      return {
        url: response.secure_url,
        public_id: response.public_id
      };
    } else {
      // Local fallback: Return local relative path
      const fileName = path.basename(localFilePath);
      const relativePath = `/uploads/${fileName}`;
      return {
        url: relativePath,
        public_id: fileName
      };
    }
  } catch (error) {
    console.error('Error during image upload: ', error);
    // Cleanup local file if it exists and error happened
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Failed to delete temp file: ', err);
      }
    }
    throw error;
  }
};

/**
 * Deletes a file from Cloudinary (or locally if fallback).
 * @param {string} publicId Cloudinary public_id or local file name
 * @returns {Promise<boolean>}
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return false;

    if (isCloudinaryConfigured) {
      const response = await cloudinary.uploader.destroy(publicId);
      return response.result === 'ok';
    } else {
      // Local fallback: remove file from uploads folder
      const localPath = path.join(__dirname, '..', 'uploads', publicId);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error during image deletion: ', error);
    return false;
  }
};

module.exports = {
  cloudinary: isCloudinaryConfigured ? cloudinary : null,
  uploadImage,
  deleteImage,
  isCloudinaryConfigured
};
