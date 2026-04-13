# 🖼️ Phase 7: Image Upload & Cloudinary Integration

## Overview
Hệ thống lưu trữ hình ảnh tập trung vào 3 thực thể: User avatars, Category images, và Product images.

**Tính năng chính:**
- ✅ Upload hình ảnh lên Cloudinary
- ✅ Tự động xóa hình ảnh cũ khi cập nhật
- ✅ Validation file (format, size)
- ✅ Secure URL delivery
- ✅ Error handling & fallback

---

## 7.1 Database Schema Updates ✅

### SQL Migrations
```sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
ALTER TABLE products ADD COLUMN image_url VARCHAR(500);
```

**Tasks:**
- [ ] Update database schema with image URL fields
- [ ] Verify columns created successfully
- [ ] Test NULL handling for images

---

## 7.2 Cloudinary Setup & Configuration ✅

### Step 1: Create Cloudinary Account
```
1. Visit https://cloudinary.com/
2. Sign up for free account
3. Verify email
4. Go to Dashboard
5. Get credentials:
   - Cloud Name (dxxxxxxxx)
   - API Key (xxxxxxxxx)
   - API Secret (xxxxxxxxxxxxxx)
```

**Tasks:**
- [ ] Create Cloudinary account
- [ ] Get Cloud Name
- [ ] Get API Key
- [ ] Get API Secret (keep secure!)

### Step 2: Configure Environment Variables
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FORMATS=jpg,jpeg,png,gif,webp
```

**Tasks:**
- [ ] Create/update `.env` file with Cloudinary credentials
- [ ] Set MAX_FILE_SIZE (default: 5MB = 5242880 bytes)
- [ ] Set ALLOWED_FORMATS (default: jpg, jpeg, png, gif, webp)
- [ ] Verify .env is in .gitignore
- [ ] Test that environment variables load correctly

### Step 3: Verify Cloudinary Connection
```bash
npm run dev

# Expected output:
# ✓ Server is running on port 3000
# If no warning about credentials, you're good!
```

**Tasks:**
- [ ] Start server with `npm run dev`
- [ ] Check logs for Cloudinary configuration warnings
- [ ] If warning appears: verify .env file
- [ ] Restart server and confirm connection works

---

## 7.3 Cloudinary Configuration File ✅

**File:** `src/config/cloudinary.js`

**Responsibilities:**
- [ ] Import cloudinary v2 SDK
- [ ] Configure with credentials from .env
- [ ] Verify credentials are loaded
- [ ] Export configured instance

**Code Review:**
```javascript
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary credentials not configured. Image upload disabled.');
}

module.exports = cloudinary;
```

**Tasks:**
- [ ] File created at `src/config/cloudinary.js`
- [ ] Configuration uses environment variables
- [ ] Warning message for missing credentials
- [ ] Module exported correctly

---

## 7.4 Multer Upload Middleware ✅

**File:** `src/middleware/upload.js`

**Responsibilities:**
- [ ] Configure multer for file handling
- [ ] Validate file format (whitelist)
- [ ] Validate file size
- [ ] Store files in memory (not disk)
- [ ] Export single file upload middleware

**Features:**
- Memory storage (files stored in RAM buffer)
- File format validation (jpg, jpeg, png, gif, webp)
- File size limit (5MB default, configurable)
- Error messages for invalid files

**Code Review Checklist:**
```javascript
// ✅ multer.memoryStorage() - keep files in buffer
// ✅ fileFilter callback - validate file format
// ✅ path.extname() - extract file extension
// ✅ ALLOWED_FORMATS from .env - configurable
// ✅ fileSize limit - prevent large uploads
// ✅ limits.fileSize - from MAX_FILE_SIZE in .env
```

**Tasks:**
- [ ] File created at `src/middleware/upload.js`
- [ ] File format validation works (jpg, jpeg, png, gif, webp)
- [ ] File size validation works (max 5MB)
- [ ] Memory storage configured
- [ ] Error callback returns proper errors
- [ ] Module exports upload instance

**Testing:**
```bash
# Test with valid file
curl -F "file=@/path/to/image.jpg" http://localhost:3000/api/test

# Test with invalid format (should fail)
curl -F "file=@/path/to/document.pdf" http://localhost:3000/api/test

# Test with oversized file (should fail)
# Create 10MB file and try upload
```

---

## 7.5 Cloudinary Utility Functions ✅

**File:** `src/utils/cloudinaryUtils.js`

**Functions Implemented:**

### Function 1: `uploadToCloudinary(fileBuffer, fileName, folder)`
**Purpose:** Upload file buffer to Cloudinary

**Parameters:**
- `fileBuffer`: Binary file data from multer
- `fileName`: Original filename
- `folder`: Cloudinary folder path (e.g., 'grocery/products')

**Returns:** Promise resolving to upload result
```javascript
{
  public_id: "grocery/products/1234567-laptop",
  secure_url: "https://res.cloudinary.com/.../image.jpg",
  url: "http://...",
  format: "jpg",
  width: 1024,
  height: 768
}
```

**Tasks:**
- [ ] Uses `upload_stream()` for streaming upload
- [ ] Converts file buffer to stream with `Readable.from()`
- [ ] Sets folder for organization
- [ ] Generates unique public ID with timestamp
- [ ] Returns secure_url for HTTPS
- [ ] Error handling with rejection

### Function 2: `deleteFromCloudinary(publicId)`
**Purpose:** Delete file from Cloudinary by public ID

**Parameters:**
- `publicId`: Cloudinary public ID (e.g., 'grocery/products/1234567-laptop')

**Returns:** Promise resolving to deletion result

**Tasks:**
- [ ] Uses `uploader.destroy()`
- [ ] Handles deletion errors gracefully
- [ ] Returns result object with status

### Function 3: `extractPublicIdFromUrl(url)`
**Purpose:** Parse Cloudinary URL to extract public ID

**Parameters:**
- `url`: Cloudinary URL string

**Returns:** Public ID string or null

**Example:**
```
Input:  "https://res.cloudinary.com/demo/image/upload/v123/grocery/products/1234567-laptop.jpg"
Output: "grocery/products/1234567-laptop"
```

**Tasks:**
- [ ] Regex pattern to extract public_id from URL
- [ ] Remove file extension
- [ ] Return null if URL invalid
- [ ] Handle edge cases (null URL, non-Cloudinary URLs)

### Function 4: `isCloudinaryUrl(url)`
**Purpose:** Validate if URL is from Cloudinary

**Parameters:**
- `url`: Any URL string

**Returns:** Boolean

**Tasks:**
- [ ] Check if URL contains "cloudinary.com"
- [ ] Return true/false
- [ ] Handle null URL (return false)

**Testing:**
```bash
# Test upload
const result = await uploadToCloudinary(buffer, 'test.jpg', 'grocery/products');
console.log(result.secure_url);  // Should be HTTPS URL

# Test delete
await deleteFromCloudinary('grocery/products/1234567-test');

# Test extract
const publicId = extractPublicIdFromUrl(cloudinaryUrl);
console.log(publicId);  // Should be "grocery/products/1234567-test"

# Test validation
isCloudinaryUrl('https://res.cloudinary.com/...'); // true
isCloudinaryUrl('https://example.com/...');        // false
```

**Tasks:**
- [ ] File created at `src/utils/cloudinaryUtils.js`
- [ ] All 4 functions implemented
- [ ] Error handling for each function
- [ ] Module exports all functions

---

## 7.6 Model Updates ✅

### User Model (`src/models/User.js`)
**New Methods:**

**Method: `create(username, password, role, avatar_url)`**
- [ ] Add `avatar_url` parameter
- [ ] Include in INSERT query
- [ ] Default to null if not provided

**Method: `updateAvatarUrl(id, avatar_url)`**
- [ ] New method to update avatar
- [ ] UPDATE query with avatar_url
- [ ] Used after successful upload

**Code Review:**
```javascript
static async create(username, password, role = 'user', avatar_url = null) {
  const query = 'INSERT INTO users (..., avatar_url) VALUES (..., ?)';
  const [result] = await pool.execute(query, [..., avatar_url]);
  return result;
}

static async updateAvatarUrl(id, avatar_url) {
  const query = 'UPDATE users SET avatar_url = ? WHERE id = ?';
  const [result] = await pool.execute(query, [avatar_url, id]);
  return result;
}
```

**Tasks:**
- [ ] `create()` accepts avatar_url parameter
- [ ] `findById()` includes avatar_url in SELECT
- [ ] `updateAvatarUrl()` method created
- [ ] Methods tested with database

---

### Category Model (`src/models/Category.js`)
**New Methods:**

**Method: `create(name, description, image_url)`**
- [ ] Add `image_url` parameter
- [ ] Include in INSERT query
- [ ] Default to null if not provided

**Method: `update(id, name, description, image_url)`**
- [ ] Add `image_url` parameter
- [ ] Include in UPDATE query
- [ ] Allow null for no image change

**Method: `updateImageUrl(id, image_url)`**
- [ ] New method for quick image update
- [ ] UPDATE only image_url field
- [ ] Used after successful upload

**Tasks:**
- [ ] `create()` accepts image_url parameter
- [ ] `update()` includes image_url
- [ ] `updateImageUrl()` method created
- [ ] All methods tested

---

### Product Model (`src/models/Product.js`)
**New Methods:**

**Method: `create(..., image_url)`**
- [ ] Add `image_url` parameter to INSERT
- [ ] Default to null if not provided

**Method: `update(..., image_url)`**
- [ ] Add `image_url` parameter to UPDATE
- [ ] Allow null for no change

**Method: `updateImageUrl(id, image_url)`**
- [ ] New method for quick image update
- [ ] UPDATE only image_url field

**Tasks:**
- [ ] `create()` accepts image_url
- [ ] `update()` includes image_url
- [ ] `updateImageUrl()` method created
- [ ] Tested with database

---

## 7.7 Controller Updates ✅

### Auth Controller (`src/controllers/authController.js`)

**Updates to `register()` endpoint:**
- [ ] Accept file from multer: `req.file`
- [ ] If file exists, upload to Cloudinary
- [ ] Handle upload errors (return 400)
- [ ] Pass avatar_url to User.create()
- [ ] Return avatarUrl in response

**New Method: `uploadAvatar(req, res)`**
- [ ] Protected route (verifyToken)
- [ ] Get current user ID from req.userId
- [ ] Check file exists
- [ ] Find user in database
- [ ] Delete old avatar if exists
- [ ] Upload new avatar to Cloudinary
- [ ] Update user record
- [ ] Return new avatarUrl

**New Method: `updateProfile(req, res)`**
- [ ] Similar to uploadAvatar
- [ ] Can update avatar along with other profile data

**Code Pattern:**
```javascript
// In register():
if (req.file) {
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    req.file.originalname,
    'grocery/avatars'
  );
  avatarUrl = uploadResult.secure_url;
}

// New uploadAvatar() method:
if (user.avatar_url) {
  const oldPublicId = extractPublicIdFromUrl(user.avatar_url);
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }
}
const uploadResult = await uploadToCloudinary(...);
await User.updateAvatarUrl(req.userId, uploadResult.secure_url);
```

**Tasks:**
- [ ] `register()` handles file upload
- [ ] `uploadAvatar()` method created
- [ ] `updateProfile()` method created
- [ ] Error handling for all upload scenarios
- [ ] Delete old image before uploading new

---

### Category Controller (`src/controllers/categoryController.js`)

**Updates to `create()` endpoint:**
- [ ] Accept file: `upload.single('image')`
- [ ] If file exists, upload to 'grocery/categories' folder
- [ ] Pass imageUrl to Category.create()
- [ ] Return imageUrl in response

**Updates to `update()` endpoint:**
- [ ] Handle file upload if provided
- [ ] Delete old image if exists
- [ ] Upload new image
- [ ] Update database with new imageUrl

**New Method: `uploadCategoryImage(req, res)`**
- [ ] Dedicated endpoint for image upload
- [ ] Similar to uploadAvatar pattern
- [ ] Delete old, upload new, update record

**Tasks:**
- [ ] `create()` includes file upload handling
- [ ] `update()` includes file replacement logic
- [ ] `uploadCategoryImage()` method created
- [ ] Auto-delete old image before new upload
- [ ] Admin-only access verified

---

### Product Controller (`src/controllers/productController.js`)

**Updates to `create()` endpoint:**
- [ ] Accept file: `upload.single('image')`
- [ ] Upload to 'grocery/products' folder
- [ ] Pass imageUrl to Product.create()
- [ ] Return imageUrl in response

**Updates to `update()` endpoint:**
- [ ] Handle file upload if provided
- [ ] Delete old image before upload
- [ ] Upload new image
- [ ] Update database with new imageUrl

**New Method: `uploadProductImage(req, res)`**
- [ ] Dedicated endpoint for product image
- [ ] Auto-delete old image
- [ ] Upload new image
- [ ] Update product record

**Updates to `delete()` endpoint:**
- [ ] Before deleting product, delete image from Cloudinary
- [ ] Extract public ID from image_url
- [ ] Call deleteFromCloudinary()
- [ ] Continue with product deletion

**Tasks:**
- [ ] `create()` includes image upload
- [ ] `update()` includes image replacement
- [ ] `uploadProductImage()` created
- [ ] `delete()` includes image cleanup
- [ ] Error handling for image operations

---

## 7.8 Routes Updates ✅

### Auth Routes (`src/routes/authRoutes.js`)

**New Endpoints:**
```javascript
router.post('/register', upload.single('avatar'), authController.register);
router.post('/avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/profile', verifyToken, upload.single('avatar'), authController.updateProfile);
```

**Tasks:**
- [ ] Import upload middleware
- [ ] Add upload.single('avatar') to register
- [ ] Add POST /avatar endpoint
- [ ] Add PUT /profile endpoint
- [ ] Test endpoints with files

---

### Category Routes (`src/routes/categoryRoutes.js`)

**Updated Endpoints:**
```javascript
router.post('/', verifyToken, verifyAdmin, upload.single('image'), categoryController.create);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), categoryController.update);
router.post('/:id/image', verifyToken, verifyAdmin, upload.single('image'), categoryController.uploadCategoryImage);
```

**Tasks:**
- [ ] Import upload middleware
- [ ] Add upload.single('image') to POST /
- [ ] Add upload.single('image') to PUT /:id
- [ ] Add new POST /:id/image endpoint
- [ ] Test all endpoints

---

### Product Routes (`src/routes/productRoutes.js`)

**Updated Endpoints:**
```javascript
router.post('/', verifyToken, verifyAdmin, upload.single('image'), productController.create);
router.put('/:id', verifyToken, verifyAdmin, upload.single('image'), productController.update);
router.post('/:id/image', verifyToken, verifyAdmin, upload.single('image'), productController.uploadProductImage);
```

**Tasks:**
- [ ] Import upload middleware
- [ ] Add upload.single('image') to POST /
- [ ] Add upload.single('image') to PUT /:id
- [ ] Add new POST /:id/image endpoint
- [ ] Test all endpoints

---

## 7.9 Testing Cloudinary Integration ✅

### Test 1: User Avatar Upload on Registration

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "username=testuser" \
  -F "password=password123" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
}
```

**Verification Checklist:**
- [ ] Status code is 201
- [ ] avatarUrl is returned
- [ ] URL is HTTPS (secure_url)
- [ ] URL contains cloudinary.com
- [ ] Image appears in Cloudinary dashboard

**Tasks:**
- [ ] Test successful upload
- [ ] Test with invalid format (.pdf) - should fail
- [ ] Test with oversized file (>5MB) - should fail
- [ ] Test without file - should work (avatarUrl null)
- [ ] Verify image in Cloudinary folder 'grocery/avatars'

---

### Test 2: Upload Avatar to Existing Account

**Login first to get token:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Response contains token**

**Upload avatar:**
```bash
curl -X POST http://localhost:3000/api/auth/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/new_avatar.jpg"
```

**Expected Response (200):**
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://res.cloudinary.com/.../new_avatar.jpg"
}
```

**Tasks:**
- [ ] Token authentication works
- [ ] New avatar uploads successfully
- [ ] Old avatar automatically deleted from Cloudinary
- [ ] avatarUrl in response is new URL
- [ ] Verify old image no longer exists in Cloudinary
- [ ] Test error handling (invalid token, no file, etc.)

---

### Test 3: Create Category with Image

**Command:**
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Electronics" \
  -F "description=Electronic devices" \
  -F "image=@/path/to/category.jpg"
```

**Expected Response (201):**
```json
{
  "message": "Category created successfully",
  "categoryId": 1,
  "imageUrl": "https://res.cloudinary.com/.../category.jpg"
}
```

**Tasks:**
- [ ] Category created successfully
- [ ] imageUrl returned
- [ ] Image stored in 'grocery/categories' folder
- [ ] Non-admin gets 403 error
- [ ] Without file still works (imageUrl null)

---

### Test 4: Update Category Image

**Command:**
```bash
curl -X POST http://localhost:3000/api/categories/1/image \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@/path/to/new_image.jpg"
```

**Expected Response (200):**
```json
{
  "message": "Category image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/.../new_image.jpg"
}
```

**Tasks:**
- [ ] New image uploads
- [ ] Old image deleted from Cloudinary
- [ ] Database updated with new URL
- [ ] Verify old image no longer accessible

---

### Test 5: Create Product with Image

**Command:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "name=Laptop" \
  -F "price=999.99" \
  -F "stock_quantity=50" \
  -F "category_id=1" \
  -F "description=High performance laptop" \
  -F "image=@/path/to/product.jpg"
```

**Expected Response (201):**
```json
{
  "message": "Product created successfully",
  "productId": 1,
  "imageUrl": "https://res.cloudinary.com/.../product.jpg"
}
```

**Tasks:**
- [ ] Product created with image
- [ ] imageUrl returned
- [ ] Image in 'grocery/products' folder
- [ ] Without image still works

---

### Test 6: Update Product Image

**Command:**
```bash
curl -X POST http://localhost:3000/api/products/1/image \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@/path/to/new_product_image.jpg"
```

**Expected Response (200):**
```json
{
  "message": "Product image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/.../new_product_image.jpg"
}
```

**Tasks:**
- [ ] Image updates successfully
- [ ] Old image deleted
- [ ] New image stored
- [ ] Database updated

---

### Test 7: Delete Product (Image Cleanup)

**Command:**
```bash
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Product deleted successfully",
  "affectedRows": 1
}
```

**Verification:**
- [ ] Product deleted from database
- [ ] Product image deleted from Cloudinary
- [ ] Old image no longer accessible

**Tasks:**
- [ ] Verify product not in database
- [ ] Verify image deleted from Cloudinary
- [ ] Test with product without image (should not error)

---

## 7.10 Error Handling ✅

### File Validation Errors

**Error 1: Invalid File Format**
```
Request: POST with .pdf file
Response: 400 Bad Request
Body: {"message": "Invalid file format. Allowed: jpg, jpeg, png, gif, webp"}
```

**Error 2: File Too Large**
```
Request: POST with 10MB file (>5MB limit)
Response: 413 Payload Too Large
Body: {"message": "File too large"}
```

**Error 3: Missing File (when optional)**
```
Request: POST without file
Response: 201 Created (file optional)
Body: {..., imageUrl: null}
```

**Error 4: Cloudinary Upload Error**
```
Cause: Invalid API credentials, network error, Cloudinary down
Response: 400 Bad Request
Body: {"message": "Failed to upload image"}
```

**Tasks:**
- [ ] Test all error scenarios
- [ ] Verify error messages are clear
- [ ] Check proper HTTP status codes
- [ ] Confirm no partial uploads occur

---

## 7.11 Security Checklist ✅

- [ ] File format whitelist enforced (no .exe, .pdf, etc.)
- [ ] File size limit enforced (5MB max)
- [ ] Cloudinary API secret never exposed in responses
- [ ] Environment variables in .env (not in code)
- [ ] .env added to .gitignore
- [ ] Old images deleted when replaced
- [ ] User can only upload own avatar
- [ ] Only admins can upload category/product images
- [ ] HTTPS URLs used (secure_url from Cloudinary)
- [ ] Public IDs generated with timestamps (unique)

**Tasks:**
- [ ] Verify all security measures implemented
- [ ] Test unauthorized access attempts
- [ ] Confirm credentials not leaked
- [ ] Check error messages don't expose secrets

---

## 7.12 Documentation ✅

**Files Created:**
- [ ] `IMAGE_UPLOAD_GUIDE.md` - Complete guide with examples
- [ ] API endpoint documentation updated in README.md
- [ ] cURL examples for all upload endpoints
- [ ] Postman collection examples
- [ ] Troubleshooting section in guide

---

## Summary of Phase 7

**Files Created (3):**
- `src/config/cloudinary.js` - Cloudinary SDK config
- `src/middleware/upload.js` - Multer file validation
- `src/utils/cloudinaryUtils.js` - Upload/delete helpers

**Files Updated (7):**
- `src/models/User.js` - Added avatar_url
- `src/models/Category.js` - Added image_url
- `src/models/Product.js` - Added image_url
- `src/controllers/authController.js` - Avatar upload
- `src/controllers/categoryController.js` - Image upload
- `src/controllers/productController.js` - Image upload
- `src/routes/*Routes.js` - File upload endpoints

**Database Updated (3):**
- users.avatar_url
- categories.image_url
- products.image_url

**New Endpoints (6):**
- POST /api/auth/register (with avatar)
- POST /api/auth/avatar
- PUT /api/auth/profile
- POST /api/categories/:id/image
- POST /api/products/:id/image
- Updated POST/PUT for create/update with images

**Total New Features: 12+ Image Upload Capabilities** ✅

