const pool = require('../config/database');

class Product {
  static async create(name, price, stock_quantity, category_id, description = '', image_url = null) {
    const query = 'INSERT INTO products (name, price, stock_quantity, category_id, description, image_url) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, price, stock_quantity, category_id, description, image_url]);
    return result;
  }

  static async findAll() {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async findById(id) {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByCategory(category_id) {
    const query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? ORDER BY p.created_at DESC';
    const [rows] = await pool.execute(query, [category_id]);
    return rows;
  }

  static async update(id, name, price, stock_quantity, category_id, description, image_url = null) {
    const query = 'UPDATE products SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, image_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, price, stock_quantity, category_id, description, image_url, id]);
    return result;
  }

  static async updateImageUrl(id, image_url) {
    const query = 'UPDATE products SET image_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [image_url, id]);
    return result;
  }

  static async updateStock(id, quantity_change) {
    const query = 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND stock_quantity + ? >= 0';
    const [result] = await pool.execute(query, [quantity_change, id, quantity_change]);
    return result;
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  }

  static async checkStock(id, quantity) {
    const query = 'SELECT stock_quantity FROM products WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    if (rows.length === 0) return false;
    return rows[0].stock_quantity >= quantity;
  }

  static async categoryExists(category_id) {
    const query = 'SELECT id FROM categories WHERE id = ?';
    const [rows] = await pool.execute(query, [category_id]);
    return rows.length > 0;
  }
}

module.exports = Product;
