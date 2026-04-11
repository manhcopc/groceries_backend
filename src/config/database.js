// const mysql = require('mysql2/promise');
// require('dotenv').config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = pool;

const { Pool } = require('pg');
require('dotenv').config();

// Khởi tạo Pool kết nối
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Bắt buộc khi kết nối từ ngoài vào Render
  }
});

// Kiểm tra kết nối
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Lỗi kết nối PostgreSQL:', err.stack);
  }
  console.log('Đã kết nối PostgreSQL thành công!');
  release();
});

module.exports = pool;