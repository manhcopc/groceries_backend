const pool = require('../config/database');

class Order {
  // Create order with transaction - Atomic operation
  static async create(user_id, items) {
    const connection = await pool.getConnection();
    try {
      // Phase 1: Validate all items before transaction
      for (const item of items) {
        const query = 'SELECT id, name, price, stock_quantity FROM products WHERE id = ?';
        const [rows] = await pool.execute(query, [item.product_id]);
        
        if (rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        
        if (rows[0].stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${rows[0].name}. Available: ${rows[0].stock_quantity}, Requested: ${item.quantity}`);
        }
      }
      
      // Phase 2: Calculate total price
      let totalPrice = 0;
      const itemsWithPrice = [];
      
      for (const item of items) {
        const query = 'SELECT price FROM products WHERE id = ?';
        const [rows] = await pool.execute(query, [item.product_id]);
        const unitPrice = rows[0].price;
        totalPrice += item.quantity * unitPrice;
        itemsWithPrice.push({ ...item, unit_price: unitPrice });
      }
      
      // Phase 3: Begin transaction
      await connection.beginTransaction();
      
      try {
        // Step 1: Create order
        const insertOrderQuery = 'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)';
        const [orderResult] = await connection.execute(insertOrderQuery, [
          user_id,
          totalPrice,
          'pending'
        ]);
        const orderId = orderResult.insertId;
        
        // Step 2: Insert order items
        const insertItemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)';
        const insertedItems = [];
        
        for (const item of itemsWithPrice) {
          const [itemResult] = await connection.execute(insertItemQuery, [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price
          ]);
          insertedItems.push({
            id: itemResult.insertId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          });
        }
        
        // Step 3: Deduct stock (AUTOMATIC) - KEY FEATURE
        const updateStockQuery = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?';
        
        for (const item of itemsWithPrice) {
          const [result] = await connection.execute(updateStockQuery, [
            item.quantity,
            item.product_id,
            item.quantity
          ]);
          
          if (result.affectedRows === 0) {
            throw new Error(`Stock deduction failed for product ${item.product_id}`);
          }
        }
        
        // Step 4: Commit transaction
        await connection.commit();
        
        return {
          orderId,
          totalPrice,
          items: insertedItems,
          status: 'pending'
        };
        
      } catch (error) {
        await connection.rollback();
        throw error;
      }
      
    } finally {
      connection.release();
    }
  }

  // Get all orders - admin view
  static async findAll(limit = 20, offset = 0) {
    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at,
             u.username as customer_name,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute(query, [limit, offset]);
    return rows;
  }

  // Get orders by user ID
  static async findByUserId(user_id, limit = 20, offset = 0) {
    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute(query, [user_id, limit, offset]);
    return rows;
  }

  // Get order by ID with all details
  static async findById(id) {
    const orderQuery = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at,
             u.username as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    
    const [orderRows] = await pool.execute(orderQuery, [id]);
    if (orderRows.length === 0) {
      return null;
    }
    
    const order = orderRows[0];
    
    // Get order items with product details
    const itemsQuery = `
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
             p.name as product_name, p.price as current_price,
             c.name as category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;
    
    const [items] = await pool.execute(itemsQuery, [id]);
    order.items = items;
    
    return order;
  }

  // Get order items for an order
  static async getOrderItems(order_id) {
    const query = `
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
             p.name as product_name, p.price as current_price,
             c.name as category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;
    
    const [rows] = await pool.execute(query, [order_id]);
    return rows;
  }

  // Update order status
  static async updateStatus(id, newStatus) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    const query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.execute(query, [newStatus, id]);
    
    return result;
  }

  // Cancel order and restore stock
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      try {
        // Get order items first
        const itemsQuery = 'SELECT product_id, quantity FROM order_items WHERE order_id = ?';
        const [items] = await connection.execute(itemsQuery, [id]);
        
        // Restore stock for all items
        const restoreStockQuery = 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?';
        
        for (const item of items) {
          await connection.execute(restoreStockQuery, [item.quantity, item.product_id]);
        }
        
        // Delete order items
        const deleteItemsQuery = 'DELETE FROM order_items WHERE order_id = ?';
        await connection.execute(deleteItemsQuery, [id]);
        
        // Delete order
        const deleteOrderQuery = 'DELETE FROM orders WHERE id = ?';
        const [result] = await connection.execute(deleteOrderQuery, [id]);
        
        await connection.commit();
        return result;
        
      } catch (error) {
        await connection.rollback();
        throw error;
      }
      
    } finally {
      connection.release();
    }
  }

  // Calculate total price from items
  static async calculateTotal(items) {
    let totalPrice = 0;
    
    for (const item of items) {
      const query = 'SELECT price FROM products WHERE id = ?';
      const [rows] = await pool.execute(query, [item.product_id]);
      
      if (rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }
      
      totalPrice += item.quantity * rows[0].price;
    }
    
    return totalPrice;
  }

  // Check if order belongs to user
  static async checkOrderOwnership(orderId, userId) {
    const query = 'SELECT user_id FROM orders WHERE id = ?';
    const [rows] = await pool.execute(query, [orderId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    return rows[0].user_id === userId;
  }

  // Get order count for pagination
  static async getOrderCount() {
    const query = 'SELECT COUNT(*) as count FROM orders';
    const [rows] = await pool.execute(query);
    return rows[0].count;
  }

  // Get user order count
  static async getUserOrderCount(user_id) {
    const query = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
    const [rows] = await pool.execute(query, [user_id]);
    return rows[0].count;
  }
}

module.exports = Order;
