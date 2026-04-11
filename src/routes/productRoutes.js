const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/category/:categoryId', productController.getByCategory);

// Admin routes
router.post('/', verifyToken, verifyAdmin, upload.single('image'), productController.create);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), productController.update);
router.post('/:id/image', verifyToken, verifyAdmin, upload.single('image'), productController.uploadProductImage);
router.patch('/:id/stock', verifyToken, verifyAdmin, productController.updateStock);
router.delete('/:id', verifyToken, verifyAdmin, productController.delete);

module.exports = router;
