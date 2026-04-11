# 🏗️ System Architecture Overview - Grocery Store Backend

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Frontend)                             │
│                    (Web App / Mobile App / Postman)                         │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │ HTTP/HTTPS Requests
                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                   │
│                  Express.js Server (Port 3000)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  - CORS Middleware (Cross-Origin requests)                                  │
│  - Body Parser (JSON parsing)                                               │
│  - Error Handler (Global error handling)                                    │
│  - 404 Handler (Route not found)                                            │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │ Route Dispatch
      ┌───────────────┼───────────────┐
      ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Routes  │ │Category Route│ │Product Routes│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │               │
       ↓                ↓               ↓
┌────────────────────────────────────────────────┐
│       MIDDLEWARE LAYER                         │
│  - JWT Verification (verifyToken)              │
│  - Admin Authorization (verifyAdmin)           │
│  - Input Validation                            │
└────────────────────┬───────────────────────────┘
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Control │ │CategoryControl│Product Control│
│  register()  │ │  create()    │  create()     │
│  login()     │ │  getAll()    │  getAll()     │
│  getProfile()│ │  getById()   │  getById()    │
└──────┬───────┘ │  update()    │  getByCategory│
       │         │  delete()    │  update()     │
       │         └──────┬───────┘  updateStock()│
       │                │         │  delete()    │
       │                │         └──────┬───────┘
       └────────────────┼────────────────┘
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ User Model   │ │Category Model │ │Product Model │
│ - create()   │ │ - create()   │ │ - create()   │
│ - findByUser │ │ - findAll()  │ │ - findAll()  │
│ - findById() │ │ - findById() │ │ - findById() │
│ - verifyPass │ │ - update()   │ │ - update()   │
└──────┬───────┘ │ - delete()   │ │ - updateStock
       │         └──────┬───────┘ │ - delete()   │
       │                │         │ - checkStock │
       │                │         └──────┬───────┘
       └────────────────┼────────────────┘
                        │ SQL Queries
       ┌────────────────┴────────────────┐
       │                                 │
       ↓                                 ↓
┌─────────────────────────────────────────────────┐
│      DATABASE LAYER (MySQL Connection Pool)     │
├─────────────────────────────────────────────────┤
│  - Max 10 concurrent connections                │
│  - Connection pooling & queue management        │
│  - Prepared statements (SQL injection safe)     │
└─────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────┐
│              MySQL DATABASE                     │
│          (grocery_store)                        │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  USERS   │  │CATEGORIES│  │ PRODUCTS │      │
│  │ Table    │  │ Table    │  │ Table    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  Indexes:      Indexes:      Indexes:          │
│  - id (PK)     - id (PK)     - id (PK)         │
│  - username    - name        - category_id (FK)│
│                               - name           │
└─────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### 1️⃣ **Presentation Layer** (Frontend)
- Web browsers, mobile apps, API clients (Postman)
- Sends HTTP requests with JSON payloads
- Receives JSON responses with status codes

### 2️⃣ **API Gateway Layer** (Express Server)
```javascript
// src/server.js
- app.use(cors())           // Allow cross-origin requests
- app.use(bodyParser.json())// Parse JSON bodies
- app.use('/api/auth', authRoutes)
- app.use('/api/categories', categoryRoutes)
- app.use('/api/products', productRoutes)
- Error handling middleware
```

### 3️⃣ **Middleware Layer** (Request Processing)
```javascript
// src/middleware/auth.js
- verifyToken()   // Extract and verify JWT
- verifyAdmin()   // Check user role
```

### 4️⃣ **Controller Layer** (Business Logic)
```javascript
// src/controllers/*Controller.js
- Validate input data
- Call model methods
- Handle errors
- Format and send responses
```

### 5️⃣ **Model Layer** (Data Access)
```javascript
// src/models/*.js
- Database queries (SELECT, INSERT, UPDATE, DELETE)
- Data transformation
- Validation logic
```

### 6️⃣ **Database Layer** (Data Storage)
```sql
-- database/schema.sql
- MySQL database with 3 tables
- Indexes for performance
- Constraints for data integrity
```

---

## Authentication Flow

```
User Input (username, password)
    ↓
POST /api/auth/login
    ↓
authController.login()
    ├─ Find user by username
    ├─ Compare password hash
    └─ Generate JWT token
    ↓
Return token + user data
    ↓
Client stores token (localStorage/sessionStorage)
    ↓
For protected routes:
    ├─ Include: Authorization: Bearer {token}
    ↓
verifyToken middleware
    ├─ Extract token
    ├─ Verify signature
    ├─ Check expiration
    └─ Extract user info (id, role)
    ↓
Request proceeds if valid
```

---

## Request-Response Cycle

### Example: Create Product (Admin Only)

```
REQUEST:
POST /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
{
  "name": "Laptop",
  "price": 999.99,
  "stock_quantity": 50,
  "category_id": 1,
  "description": "High performance"
}

         ↓

MIDDLEWARE CHAIN:
1. verifyToken middleware
   - Extract token from header
   - Verify JWT signature
   - Decode: {id: 1, role: "admin"}
   - Set: req.userId = 1, req.userRole = "admin"

2. verifyAdmin middleware
   - Check: req.userRole === "admin" ✓
   - Allow request to proceed

         ↓

CONTROLLER (productController.js):
1. Validate input
   - name required ✓
   - price required ✓
   - stock_quantity required ✓
   - category_id required ✓

2. Call model
   - Product.create(name, price, stock_quantity, category_id, description)

         ↓

MODEL (Product.js):
1. Execute SQL query
   - INSERT INTO products (name, price, stock_quantity, category_id, description)
   - VALUES (?, ?, ?, ?, ?)
   - Prepared statement (safe from SQL injection)

         ↓

DATABASE:
1. Insert record
   - Return insertId = 42

         ↓

MODEL returns:
{ insertId: 42, affectedRows: 1 }

         ↓

CONTROLLER formats response:
{
  "message": "Product created successfully",
  "productId": 42
}

         ↓

RESPONSE:
HTTP 201 Created
{
  "message": "Product created successfully",
  "productId": 42
}
```

---

## Error Handling Flow

```
Request → Middleware → Controller → Model → Database
                        ↓ Error occurs
                        ↓
                  Error caught
                        ↓
               Error type check
                    ↙    ↓    ↘
              400         401    409
            Invalid     Invalid  Duplicate
            Input       Token    Entry
                        ↓
                  Format error response
                        ↓
                  Send to client
```

---

## Data Security Measures

### 🔐 **Password Security**
```javascript
// User registration
const plainPassword = "password123"
const salt = await bcrypt.genSalt(10)          // Generate salt
const hash = await bcrypt.hash(plainPassword, salt)  // Hash password
// Store hash in database (never store plain password)

// User login
const hash = user.password_hash  // From database
const match = await bcrypt.compare(plainPassword, hash)
// Returns: true/false
```

### 🔐 **Token Security**
```javascript
// Generate JWT
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,           // Secret key
  { expiresIn: '7d' }               // Expiration
)

// Verify JWT
jwt.verify(token, process.env.JWT_SECRET)  // Throws if invalid/expired
```

### 🔐 **Database Security**
```javascript
// Prepared Statements (prevent SQL injection)
const query = 'SELECT * FROM products WHERE id = ?'
const [rows] = await pool.execute(query, [id])  // Parameterized query
// NOT: SELECT * FROM products WHERE id = ${id}
```

### 🔐 **CORS Protection**
```javascript
app.use(cors())  // Only allow requests from frontend origin
```

---

## Performance Optimization

### 1. Database Indexes
```sql
-- Fast lookups
INDEX idx_products_category ON products(category_id)
INDEX idx_products_name ON products(name)
INDEX idx_users_username ON users(username)
```

### 2. Connection Pooling
```javascript
// Reuse connections instead of creating new ones
connectionLimit: 10  // Max 10 concurrent connections
queueLimit: 0        // Unlimited queue
```

### 3. JOIN Queries
```sql
-- Fetch related data in single query (avoid N+1 problem)
SELECT p.*, c.name as category_name 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id
```

### 4. Prepared Statements
```javascript
// Compiled once, executed multiple times
const query = 'SELECT * FROM products WHERE category_id = ?'
await pool.execute(query, [categoryId])  // Fast execution
```

---

## Scalability & Future Enhancements

### Current Limitations
- Single database instance
- No caching layer
- No rate limiting
- Basic error logging

### Future Improvements
```
Level 1: Performance
├── Add Redis caching for frequently accessed data
├── Implement request rate limiting
├── Add query performance monitoring
└── Database query optimization

Level 2: Features
├── Add order/transaction tables
├── Implement inventory alerts
├── Add product images/media storage
├── User role-based access control (RBAC)
└── Audit logging

Level 3: Scalability
├── Database replication
├── Load balancing
├── API versioning (v1, v2)
├── Microservices architecture
└── Message queue for async operations

Level 4: DevOps
├── Containerization (Docker)
├── CI/CD pipeline
├── Monitoring & alerting
├── Automated backups
└── Disaster recovery
```

---

## Technology Stack Summary

```
┌────────────────────────────────────────────────┐
│           TECHNOLOGY STACK                     │
├────────────────────────────────────────────────┤
│ Runtime:      Node.js v16+                     │
│ Framework:    Express.js 5.x                   │
│ Language:     JavaScript (CommonJS)            │
│ Database:     MySQL 5.7+                       │
│ ORM/Query:    mysql2/promise (raw queries)     │
│ Auth:         JWT (jsonwebtoken)               │
│ Hashing:      bcryptjs                         │
│ CORS:         cors middleware                  │
│ Parsing:      body-parser                      │
│ Config:       dotenv                           │
│ Dev Tools:    nodemon                          │
└────────────────────────────────────────────────┘
```

---

## File Organization Strategy

```
src/
├── config/           → Configuration files
│   └── database.js   → MySQL connection pool
│
├── models/           → Data access layer
│   ├── User.js       → User queries & logic
│   ├── Category.js   → Category queries & logic
│   └── Product.js    → Product queries & logic
│
├── controllers/      → Business logic layer
│   ├── authController.js        → Auth logic
│   ├── categoryController.js    → Category logic
│   └── productController.js     → Product logic
│
├── routes/           → API endpoint definitions
│   ├── authRoutes.js            → Auth routes
│   ├── categoryRoutes.js        → Category routes
│   └── productRoutes.js         → Product routes
│
├── middleware/       → Request processing
│   └── auth.js       → JWT verification
│
└── server.js         → Express app setup & startup
```

---

## Development Workflow

```
1. Setup Phase (One-time)
   ├── npm install
   ├── Create .env file
   ├── Create database (mysql < database/schema.sql)
   └── npm run dev

2. Development Phase
   ├── Modify files
   ├── nodemon auto-reloads on save
   ├── Test via curl/Postman
   └── Check console logs

3. Testing Phase
   ├── Follow development_checklist.md
   ├── Test each endpoint
   ├── Verify error handling
   └── Test authentication

4. Production Phase
   ├── Change JWT_SECRET
   ├── Set NODE_ENV=production
   ├── npm start
   └── Monitor logs
```

---

## Key Architectural Decisions

| Decision            | Reason                                    |
| ------------------- | ----------------------------------------- |
| Express.js          | Lightweight, flexible, good for REST APIs |
| MySQL               | Relational data model, ACID transactions  |
| JWT                 | Stateless auth, scalable, secure          |
| bcryptjs            | Industry standard password hashing        |
| Connection pooling  | Better performance, resource management   |
| Prepared statements | SQL injection prevention                  |
| Middleware pattern  | Clean separation of concerns              |
| Layer architecture  | Testable, maintainable code               |
| Raw SQL queries     | Fine control, good for small projects     |

