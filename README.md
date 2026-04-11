# 🛒 Grocery Store Backend API

Hệ thống backend cho cửa hàng bách hóa duy nhất với xác thực JWT, quản lý danh mục và sản phẩm.

## 🎯 Tính Năng Chính

- ✅ **Xác thực JWT** - Đăng ký, đăng nhập, quản lý token
- ✅ **Quản lý Danh mục** - CRUD danh mục sản phẩm
- ✅ **Quản lý Sản phẩm** - CRUD sản phẩm, quản lý tồn kho
- ✅ **Phân quyền** - Admin và User roles
- ✅ **Bảo mật** - Password hashing, JWT tokens, CORS

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js** v16 trở lên
- **MySQL** v5.7 trở lên
- **npm** v7 trở lên

---

## 🚀 Cài Đặt & Chạy

### 1. Clone và Cài Dependencies

```bash
cd /Users/copc/Workspace/intern/grocery_backend
npm install
```

### 2. Cấu Hình Database

Chỉnh sửa file `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=grocery_store
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=7d
```

### 3. Tạo Database

```bash
mysql -u root -p < database/schema.sql
```

### 4. Chạy Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy trên `http://localhost:3000`

---

## 📊 Cấu Trúc Project

```
grocery_backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js    # Auth logic (register, login)
│   │   ├── categoryController.js# Category CRUD
│   │   └── productController.js # Product CRUD + stock
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Category.js          # Category model
│   │   └── Product.js           # Product model
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── categoryRoutes.js    # Category endpoints
│   │   └── productRoutes.js     # Product endpoints
│   └── server.js                # Express app entry point
├── database/
│   └── schema.sql               # Database schema
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies
└── development_checklist.md     # Development guide

```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint             | Description           | Auth |
| ------ | -------------------- | --------------------- | ---- |
| POST   | `/api/auth/register` | Đăng ký tài khoản mới | ❌    |
| POST   | `/api/auth/login`    | Đăng nhập             | ❌    |
| GET    | `/api/auth/profile`  | Lấy thông tin profile | ✅    |

### Categories

| Method | Endpoint              | Description          | Auth | Role  |
| ------ | --------------------- | -------------------- | ---- | ----- |
| GET    | `/api/categories`     | Lấy tất cả danh mục  | ❌    | -     |
| GET    | `/api/categories/:id` | Lấy danh mục theo ID | ❌    | -     |
| POST   | `/api/categories`     | Tạo danh mục mới     | ✅    | admin |
| PUT    | `/api/categories/:id` | Cập nhật danh mục    | ✅    | admin |
| DELETE | `/api/categories/:id` | Xóa danh mục         | ✅    | admin |

### Products

| Method | Endpoint                             | Description                | Auth | Role  |
| ------ | ------------------------------------ | -------------------------- | ---- | ----- |
| GET    | `/api/products`                      | Lấy tất cả sản phẩm        | ❌    | -     |
| GET    | `/api/products/:id`                  | Lấy sản phẩm theo ID       | ❌    | -     |
| GET    | `/api/products/category/:categoryId` | Lấy sản phẩm theo danh mục | ❌    | -     |
| POST   | `/api/products`                      | Tạo sản phẩm mới           | ✅    | admin |
| PUT    | `/api/products/:id`                  | Cập nhật sản phẩm          | ✅    | admin |
| PATCH  | `/api/products/:id/stock`            | Cập nhật tồn kho           | ✅    | admin |
| DELETE | `/api/products/:id`                  | Xóa sản phẩm               | ✅    | admin |

---

## 📝 Ví Dụ Sử Dụng API

### 1. Đăng Ký

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### 2. Đăng Nhập

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 3. Tạo Danh Mục

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Electronics",
    "description": "Electronic items"
  }'
```

### 4. Tạo Sản Phẩm

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Laptop",
    "price": 999.99,
    "stock_quantity": 50,
    "category_id": 1,
    "description": "High performance laptop"
  }'
```

### 5. Cập Nhật Tồn Kho

```bash
# Tăng tồn kho
curl -X PATCH http://localhost:3000/api/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quantity_change": 10
  }'
```

---

## 🔐 Xác Thực & Bảo Mật

### JWT Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjExOTUxNDAwLCJleHAiOjE2MTI1NTYyMDB9.abc123...
```

### Token Expiration

- Mặc định: 7 ngày
- Có thể cấu hình trong `.env` với `JWT_EXPIRATION`

### Password Security

- Hashing: bcryptjs (10 salt rounds)
- Lưu ý: Passwords không bao giờ được trả về trong response

---

## 💾 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Categories Table

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Products Table

```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

---

## 🧪 Kiểm Thử

Xem file `development_checklist.md` để hướng dẫn kiểm thử chi tiết cho từng phase.

### Health Check

```bash
curl http://localhost:3000/api/health
```

---

## 📚 Công Nghệ Sử Dụng

- **Express.js** - Web framework
- **MySQL2** - Database driver
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

---

## 🤝 Đóng Góp

Vui lòng tạo pull request hoặc issues cho bất kỳ cải tiến.

---

## 📄 License

ISC
