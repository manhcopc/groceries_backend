const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/register', upload.single('avatar'), authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/profile', verifyToken, upload.single('avatar'), authController.updateProfile);

module.exports = router;
