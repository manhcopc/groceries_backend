const pool = require('../config/database');

class Product {
  static async create(name, price, stock_quantity, category_id, description = '', image_url = null) {
    const query = 'INSERT INTO products (name, price, stock_quantity, category_id, description, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
    const result = await pool.query(query, [name, price, stock_quantity, category_id, description, image_url]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByCategory(category_id) {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = $1 ORDER BY p.created_at DESC';
    const result = await pool.query(query, [category_id]);
    return result.rows;
  }

  static async update(id, name, price, stock_quantity, category_id, description, image_url = null) {
    const query = 'UPDATE products SET name = $1, price = $2, stock_quantity = $3, category_id = $4, description = $5, image_url = $6 WHERE id = $7';
    const result = await pool.query(query, [name, price, stock_quantity, category_id, description, image_url, id]);
    return result;
  }

  static async updateImageUrl(id, image_url) {
    const query = 'UPDATE products SET image_url = $1 WHERE id = $2';
    const result = await pool.query(query, [image_url, id]);
    return result;
  }

  static async updateStock(id, quantity_change) {
    const query = 'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND stock_quantity + $1 >= 0';
    const result = await pool.query(query, [quantity_change, id]);
    return result;
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result;
  }

  static async checkStock(id, quantity) {
    const query = 'SELECT stock_quantity FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return false;
    return result.rows[0].stock_quantity >= quantity;
  }

  static async categoryExists(category_id) {
    const query = 'SELECT id FROM categories WHERE id = $1';
    const result = await pool.query(query, [category_id]);
    return result.rows.length > 0;
  }
}

module.exports = Product;
