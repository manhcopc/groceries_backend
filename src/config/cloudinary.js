const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary credentials not configured. Image upload disabled.');
}

module.exports = cloudinary;
