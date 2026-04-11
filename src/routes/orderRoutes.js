const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// User routes - Protected with authentication
router.post('/', verifyToken, orderController.create);
router.get('/', verifyToken, orderController.getAll);
router.get('/:id', verifyToken, orderController.getById);
router.delete('/:id', verifyToken, orderController.delete);

// Admin routes - Protected with authentication + admin role
router.put('/:id/status', verifyToken, verifyAdmin, orderController.updateStatus);

module.exports = router;
