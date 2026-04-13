const Order = require('../models/Order');
const Product = require('../models/Product');

exports.create = async (req, res) => {
  try {
    const { items } = req.body;
    const user_id = req.userId;

    // Validation: items array required
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'items array is required' });
    }

    // Validation: items array cannot be empty
    if (items.length === 0) {
      return res.status(400).json({ message: 'items array cannot be empty' });
    }

    // Validation: each item must have product_id and quantity
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return res.status(400).json({ 
          message: 'Each item must have product_id and quantity' 
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ 
          message: 'quantity must be a positive integer' 
        });
      }
    }

    // Create order with transaction (automatic stock deduction)
    const order = await Order.create(user_id, items);

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order.orderId,
      totalPrice: order.totalPrice,
      status: order.status,
      items: order.items
    });

  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle specific error messages
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.message.includes('Stock deduction failed')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const user_id = req.userId;
    const user_role = req.userRole;

    let orders;

    // Users see only their orders, admins see all
    if (user_role === 'admin') {
      orders = await Order.findAll(limit, offset);
    } else {
      orders = await Order.findByUserId(user_id, limit, offset);
    }

    res.json({
      message: 'Orders retrieved successfully',
      data: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.userId;
    const user_role = req.userRole;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership: user can only view their own order (unless admin)
    if (user_role !== 'admin' && order.user_id !== user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      message: 'Order retrieved successfully',
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation: status required
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    // Validation: valid status values
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}` 
      });
    }

    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transition
    const currentStatus = order.status;
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [], // Cannot change from delivered
      'cancelled': []  // Cannot change from cancelled
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${currentStatus} to ${status}` 
      });
    }

    // Update status
    const result = await Order.updateStatus(id, status);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to update order status' });
    }

    // Fetch updated order
    const updatedOrder = await Order.findById(id);

    res.json({
      message: 'Order status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.userId;
    const user_role = req.userRole;

    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership
    if (user_role !== 'admin' && order.user_id !== user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot cancel delivered orders
    if (order.status === 'delivered') {
      return res.status(400).json({ 
        message: 'Cannot cancel delivered order' 
      });
    }

    // Cannot cancel already cancelled orders
    if (order.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Order is already cancelled' 
      });
    }

    // Delete order and restore stock
    const result = await Order.delete(id);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to cancel order' });
    }

    res.json({
      message: 'Order cancelled successfully',
      orderId: id,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
