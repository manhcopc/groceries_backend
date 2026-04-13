const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, password, role = 'user', avatar_url = null) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const query = 'INSERT INTO users (username, password_hash, role, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id';
    const result = await pool.query(query, [username, password_hash, role, avatar_url]);
    
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT id, username, role, avatar_url, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  static async updateAvatarUrl(id, avatar_url) {
    const query = 'UPDATE users SET avatar_url = $1 WHERE id = $2';
    const result = await pool.query(query, [avatar_url, id]);
    
    return result;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
