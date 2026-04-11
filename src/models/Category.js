const pool = require('../config/database');

class Category {
  static async create(name, description = '', image_url = null) {
    const query = 'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)';
    const [result] = await pool.execute(query, [name, description, image_url]);
    return result;
  }

  static async findAll() {
    const query = 'SELECT * FROM categories ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  static async update(id, name, description, image_url = null) {
    const query = 'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, description, image_url, id]);
    return result;
  }

  static async updateImageUrl(id, image_url) {
    const query = 'UPDATE categories SET image_url = ? WHERE id = ?';
    const [result] = await pool.execute(query, [image_url, id]);
    return result;
  }

  static async delete(id) {
    const query = 'DELETE FROM categories WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  }
}

module.exports = Category;
