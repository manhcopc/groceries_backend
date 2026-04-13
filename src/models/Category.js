const pool = require('../config/database');

class Category {
  static async create(name, description = '', image_url = null) {
    const query = 'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id';
    const result = await pool.query(query, [name, description, image_url]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM categories ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id, name, description, image_url = null) {
    const query = 'UPDATE categories SET name = $1, description = $2, image_url = $3 WHERE id = $4';
    const result = await pool.query(query, [name, description, image_url, id]);
    return result;
  }

  static async updateImageUrl(id, image_url) {
    const query = 'UPDATE categories SET image_url = $1 WHERE id = $2';
    const result = await pool.query(query, [image_url, id]);
    return result;
  }

  static async delete(id) {
    const query = 'DELETE FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result;
  }
}

module.exports = Category;
