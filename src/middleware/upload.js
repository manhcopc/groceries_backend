const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store in memory before uploading to Cloudinary

const fileFilter = (req, file, cb) => {
  const allowedFormats = (process.env.ALLOWED_FORMATS || 'jpg,jpeg,png,gif,webp').split(',');
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedFormats.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
});

module.exports = upload;
