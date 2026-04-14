const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', upload.single('avatar'), authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/profile', verifyToken, upload.single('avatar'), authController.updateProfile);

// Admin-only routes
router.post('/register-admin', verifyToken, verifyAdmin, upload.single('avatar'), authController.registerAdmin);

module.exports = router;
