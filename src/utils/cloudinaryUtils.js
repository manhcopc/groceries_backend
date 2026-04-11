const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - File name
 * @param {string} folder - Cloudinary folder (e.g., 'grocery/products', 'grocery/avatars')
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (fileBuffer, fileName, folder = 'grocery') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  // Format: https://res.cloudinary.com/.../v.../folder/public_id.ext
  const matches = url.match(/\/([^\/]+)\/([^\/]+)$/);
  if (matches) {
    const [, folder, fileWithExt] = matches;
    const fileName = fileWithExt.replace(/\.[^/.]+$/, '');
    return `${folder}/${fileName}`;
  }
  return null;
};

/**
 * Validate if URL is from Cloudinary
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  isCloudinaryUrl
};
