const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, upload.single('image'), categoryController.create);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), categoryController.update);
router.post('/:id/image', verifyToken, verifyAdmin, upload.single('image'), categoryController.uploadCategoryImage);
router.delete('/:id', verifyToken, verifyAdmin, categoryController.delete);

module.exports = router;
