const pool = require('../config/database');

class Order {
  // Create order with transaction - Atomic operation
  static async create(user_id, items) {
    const client = await pool.connect();
    try {
      // Phase 1: Validate all items before transaction
      for (const item of items) {
        const query = 'SELECT id, name, price, stock_quantity FROM products WHERE id = $1';
        const result = await pool.query(query, [item.product_id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        
        if (result.rows[0].stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${result.rows[0].name}. Available: ${result.rows[0].stock_quantity}, Requested: ${item.quantity}`);
        }
      }
      
      // Phase 2: Calculate total price
      let totalPrice = 0;
      const itemsWithPrice = [];
      
      for (const item of items) {
        const query = 'SELECT price FROM products WHERE id = $1';
        const result = await pool.query(query, [item.product_id]);
        const unitPrice = result.rows[0].price;
        totalPrice += item.quantity * unitPrice;
        itemsWithPrice.push({ ...item, unit_price: unitPrice });
      }
      
      // Phase 3: Begin transaction
      await client.query('BEGIN');
      
      try {
        // Step 1: Create order
        const insertOrderQuery = 'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id';
        const orderResult = await client.query(insertOrderQuery, [
          user_id,
          totalPrice,
          'pending'
        ]);
        const orderId = orderResult.rows[0].id;
        
        // Step 2: Insert order items
        const insertItemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING id';
        const insertedItems = [];
        
        for (const item of itemsWithPrice) {
          const itemResult = await client.query(insertItemQuery, [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price
          ]);
          insertedItems.push({
            id: itemResult.rows[0].id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          });
        }
        
        // Step 3: Deduct stock (AUTOMATIC) - KEY FEATURE
        const updateStockQuery = 'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1';
        
        for (const item of itemsWithPrice) {
          const result = await client.query(updateStockQuery, [
            item.quantity,
            item.product_id
          ]);
          
          if (result.rowCount === 0) {
            throw new Error(`Stock deduction failed for product ${item.product_id}`);
          }
        }
        
        // Step 4: Commit transaction
        await client.query('COMMIT');
        
        return {
          orderId,
          totalPrice,
          items: insertedItems,
          status: 'pending'
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      
    } finally {
      client.release();
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
      GROUP BY o.id, u.username
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Get orders by user ID
  static async findByUserId(user_id, limit = 20, offset = 0) {
    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [user_id, limit, offset]);
    return result.rows;
  }

  // Get order by ID with all details
  static async findById(id) {
    const orderQuery = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.created_at, o.updated_at,
             u.username as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [id]);
    if (orderResult.rows.length === 0) {
      return null;
    }
    
    const order = orderResult.rows[0];
    
    // Get order items with product details
    const itemsQuery = `
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
             p.name as product_name, p.price as current_price,
             c.name as category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;
    
    const itemsResult = await pool.query(itemsQuery, [id]);
    order.items = itemsResult.rows;
    
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
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;
    
    const result = await pool.query(query, [order_id]);
    return result.rows;
  }

  // Update order status
  static async updateStatus(id, newStatus) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    const query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    const result = await pool.query(query, [newStatus, id]);
    
    return result;
  }

  // Cancel order and restore stock
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      try {
        // Get order items first
        const itemsQuery = 'SELECT product_id, quantity FROM order_items WHERE order_id = $1';
        const itemsResult = await client.query(itemsQuery, [id]);
        const items = itemsResult.rows;
        
        // Restore stock for all items
        const restoreStockQuery = 'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2';
        
        for (const item of items) {
          await client.query(restoreStockQuery, [item.quantity, item.product_id]);
        }
        
        // Delete order items
        const deleteItemsQuery = 'DELETE FROM order_items WHERE order_id = $1';
        await client.query(deleteItemsQuery, [id]);
        
        // Delete order
        const deleteOrderQuery = 'DELETE FROM orders WHERE id = $1';
        const result = await client.query(deleteOrderQuery, [id]);
        
        await client.query('COMMIT');
        return result;
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      
    } finally {
      client.release();
    }
  }

  // Calculate total price from items
  static async calculateTotal(items) {
    let totalPrice = 0;
    
    for (const item of items) {
      const query = 'SELECT price FROM products WHERE id = $1';
      const result = await pool.query(query, [item.product_id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }
      
      totalPrice += item.quantity * result.rows[0].price;
    }
    
    return totalPrice;
  }

  // Check if order belongs to user
  static async checkOrderOwnership(orderId, userId) {
    const query = 'SELECT user_id FROM orders WHERE id = $1';
    const result = await pool.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].user_id === userId;
  }

  // Get order count for pagination
  static async getOrderCount() {
    const query = 'SELECT COUNT(*) as count FROM orders';
    const result = await pool.query(query);
    return result.rows[0].count;
  }

  // Get user order count
  static async getUserOrderCount(user_id) {
    const query = 'SELECT COUNT(*) as count FROM orders WHERE user_id = $1';
    const result = await pool.query(query, [user_id]);
    return result.rows[0].count;
  }
}

module.exports = Order;
