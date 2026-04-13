# 🖼️ Image Upload & Storage System - Cloudinary Integration

## Overview

Hệ thống lưu trữ hình ảnh sử dụng **Cloudinary** - dịch vụ lưu trữ hình ảnh chuyên nghiệp hàng đầu.

**Tính năng:**
- ✅ Upload hình ảnh từ clients
- ✅ Tự động resize & optimize
- ✅ Cached delivery qua CDN
- ✅ Secure URL signatures
- ✅ Delete & manage files

---

## 📋 Database Schema Updates

### Users Table - New Field
```sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
```

**Column Details:**
- `avatar_url`: VARCHAR(500) - Cloudinary URL cho user avatar
- Nullable: Yes (users có thể không có avatar)
- Example: `https://res.cloudinary.com/...jpg`

### Categories Table - New Field
```sql
ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
```

**Column Details:**
- `image_url`: VARCHAR(500) - Cloudinary URL cho category image
- Nullable: Yes (categories có thể không có hình ảnh)

### Products Table - New Field
```sql
ALTER TABLE products ADD COLUMN image_url VARCHAR(500);
```

**Column Details:**
- `image_url`: VARCHAR(500) - Cloudinary URL cho product image
- Nullable: Yes (products có thể không có hình ảnh)

---

## 🔧 Cloudinary Setup

### Step 1: Create Cloudinary Account

1. Đăng ký tại: https://cloudinary.com/
2. Confirm email
3. Go to Dashboard
4. Get credentials:
   - **Cloud Name**: Unique identifier
   - **API Key**: Public key
   - **API Secret**: Secret key (keep secure!)

### Step 2: Configure Environment

Cập nhật `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FORMATS=jpg,jpeg,png,gif,webp
```

**Important:** NEVER commit `.env` file to git with real credentials!

### Step 3: Verify Connection

```bash
npm run dev

# Watch for startup logs:
# ✓ Server is running on port 3000
```

If credentials are missing:
```
⚠️  Cloudinary credentials not configured. Image upload disabled.
```

---

## 📁 Project Files

### New Files Created

```
src/
├── config/
│   └── cloudinary.js              # Cloudinary SDK setup
├── middleware/
│   └── upload.js                  # Multer config + file validation
└── utils/
    └── cloudinaryUtils.js         # Upload/delete helper functions
```

### Updated Files

```
src/
├── controllers/
│   ├── authController.js          # Added: uploadAvatar, updateProfile
│   ├── categoryController.js      # Added: uploadCategoryImage
│   └── productController.js       # Added: uploadProductImage
├── models/
│   ├── User.js                    # Added: updateAvatarUrl()
│   ├── Category.js                # Added: updateImageUrl()
│   └── Product.js                 # Added: updateImageUrl()
└── routes/
    ├── authRoutes.js              # Added: POST /avatar, PUT /profile
    ├── categoryRoutes.js          # Added: POST /:id/image
    └── productRoutes.js           # Added: POST /:id/image
```

---

## 🚀 API Endpoints

### User Avatar Upload

**Register with Avatar:**
```bash
POST /api/auth/register
Content-Type: multipart/form-data

{
  "username": "john_doe",
  "password": "secure_password",
  "avatar": <file>
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
}
```

**Upload Avatar (Existing User):**
```bash
POST /api/auth/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "avatar": <file>
}
```

**Update Profile with Avatar:**
```bash
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "avatar": <file>
}
```

---

### Category Image Upload

**Create Category with Image:**
```bash
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Electronics",
  "description": "Electronic devices",
  "image": <file>
}
```

**Response:**
```json
{
  "message": "Category created successfully",
  "categoryId": 1,
  "imageUrl": "https://res.cloudinary.com/.../category.jpg"
}
```

**Update Category Image:**
```bash
POST /api/categories/1/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "image": <file>
}
```

---

### Product Image Upload

**Create Product with Image:**
```bash
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "Laptop",
  "price": 999.99,
  "stock_quantity": 50,
  "category_id": 1,
  "description": "High performance laptop",
  "image": <file>
}
```

**Response:**
```json
{
  "message": "Product created successfully",
  "productId": 1,
  "imageUrl": "https://res.cloudinary.com/.../product.jpg"
}
```

**Upload Product Image:**
```bash
POST /api/products/1/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "image": <file>
}
```

---

## 🛡️ File Upload Security

### Validation Layers

**1. Multer Middleware (`upload.js`)**
```javascript
- File size limit: 5MB (configurable)
- File format whitelist: jpg, jpeg, png, gif, webp
- Memory storage (no temp files)
```

**2. Controller Validation**
```javascript
- Check if file exists
- Verify resource (user/category/product) exists
- Handle upload errors gracefully
```

**3. Cloudinary Security**
```javascript
- Secure URLs (HTTPS)
- Unique public IDs (timestamp + filename)
- Organized folders (grocery/products, grocery/avatars)
- API secret verification
```

### File Size Limits

```javascript
MAX_FILE_SIZE = 5242880  // 5MB in bytes

// Can be configured in .env:
MAX_FILE_SIZE=10485760  // 10MB
```

### Allowed Formats

```javascript
ALLOWED_FORMATS = 'jpg,jpeg,png,gif,webp'

// Custom formats in .env:
ALLOWED_FORMATS=jpg,jpeg,png,gif,webp,svg,bmp
```

---

## 🔄 Image Upload Flow

```
User selects file
    ↓
Client sends multipart/form-data request
    ↓
Express receives request
    ↓
Multer middleware processes file
    ├─ Validate format
    ├─ Check file size
    └─ Store in memory buffer
    ↓
Controller handles request
    ├─ Validate user/resource exists
    └─ Prepare for upload
    ↓
Upload to Cloudinary
    ├─ Stream file buffer
    ├─ Set folder (grocery/products, etc)
    └─ Generate public ID
    ↓
Cloudinary processes & stores
    ├─ Optimize image
    ├─ Create CDN cache
    └─ Return secure URL
    ↓
Delete old image (if exists)
    ├─ Extract public ID from old URL
    └─ Call Cloudinary delete API
    ↓
Update database
    ├─ Store new image URL
    └─ Update timestamp
    ↓
Return response to client
    └─ Include new image URL
```

---

## 🧹 Image Deletion

### Auto-Delete on Update

Khi upload hình ảnh mới, hình cũ sẽ tự động xóa:

```javascript
// Delete old image
if (product.image_url) {
  const oldPublicId = extractPublicIdFromUrl(product.image_url);
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }
}

// Upload new image
const uploadResult = await uploadToCloudinary(...);
```

### Auto-Delete on Resource Delete

Khi xóa resource (product, category), hình ảnh cũng bị xóa:

```javascript
if (product.image_url) {
  const publicId = extractPublicIdFromUrl(product.image_url);
  if (publicId) {
    await deleteFromCloudinary(publicId);
  }
}

// Delete product
await Product.delete(id);
```

### Error Handling

```javascript
try {
  await deleteFromCloudinary(publicId);
} catch (error) {
  // Log warning but continue with operation
  console.error('Image deletion warning:', error);
  // Product still gets deleted even if image deletion fails
}
```

---

## 📊 Cloudinary Utils Functions

### `uploadToCloudinary(fileBuffer, fileName, folder)`

**Parameters:**
- `fileBuffer`: Buffer từ multer
- `fileName`: Original filename
- `folder`: Cloudinary folder (e.g., 'grocery/products')

**Returns:** Upload result object
```javascript
{
  public_id: "grocery/products/1234567-laptop",
  secure_url: "https://res.cloudinary.com/.../image.jpg",
  url: "http://res.cloudinary.com/.../image.jpg",
  format: "jpg",
  width: 1024,
  height: 768
}
```

**Usage:**
```javascript
const uploadResult = await uploadToCloudinary(
  req.file.buffer,
  req.file.originalname,
  'grocery/products'
);
const imageUrl = uploadResult.secure_url;
```

---

### `deleteFromCloudinary(publicId)`

**Parameters:**
- `publicId`: Public ID from Cloudinary

**Returns:** Deletion result
```javascript
{
  result: "ok"  // or "not found"
}
```

**Usage:**
```javascript
const publicId = extractPublicIdFromUrl(imageUrl);
await deleteFromCloudinary(publicId);
```

---

### `extractPublicIdFromUrl(url)`

**Parameters:**
- `url`: Cloudinary URL

**Returns:** Public ID string

**Example:**
```javascript
// Input:
"https://res.cloudinary.com/demo/image/upload/v123/grocery/products/1234567-laptop.jpg"

// Output:
"grocery/products/1234567-laptop"
```

---

### `isCloudinaryUrl(url)`

**Parameters:**
- `url`: Any URL

**Returns:** Boolean

**Usage:**
```javascript
if (isCloudinaryUrl(url)) {
  // It's a Cloudinary URL
}
```

---

## 🧪 Testing with cURL

### Test Upload Avatar

```bash
# Register with avatar
curl -X POST http://localhost:3000/api/auth/register \
  -F "username=testuser" \
  -F "password=password123" \
  -F "avatar=@/path/to/avatar.jpg"

# Upload avatar (need token from login)
curl -X POST http://localhost:3000/api/auth/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Test Upload Product Image

```bash
# Create product with image
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Laptop" \
  -F "price=999.99" \
  -F "stock_quantity=50" \
  -F "category_id=1" \
  -F "description=High performance laptop" \
  -F "image=@/path/to/product.jpg"

# Upload product image
curl -X POST http://localhost:3000/api/products/1/image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/product.jpg"
```

### Test Upload Category Image

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Electronics" \
  -F "description=Electronic devices" \
  -F "image=@/path/to/category.jpg"
```

---

## 📚 Postman Testing

### Setup Postman Collection

**1. Create Environment:**
- `{{base_url}}`: http://localhost:3000
- `{{admin_token}}`: Your JWT token
- `{{user_token}}`: Your JWT token

**2. Test Requests:**

**Register with Avatar:**
```
POST {{base_url}}/api/auth/register
Body (form-data):
  - username: testuser
  - password: password123
  - avatar: <select file>
```

**Upload Category Image:**
```
POST {{base_url}}/api/categories
Headers:
  - Authorization: Bearer {{admin_token}}
Body (form-data):
  - name: Electronics
  - description: Electronic devices
  - image: <select file>
```

**Upload Product Image:**
```
POST {{base_url}}/api/products
Headers:
  - Authorization: Bearer {{admin_token}}
Body (form-data):
  - name: Laptop
  - price: 999.99
  - stock_quantity: 50
  - category_id: 1
  - description: High performance laptop
  - image: <select file>
```

---

## 🐛 Troubleshooting

### Issue: "Cloudinary credentials not configured"

**Solution:**
1. Check `.env` file has credentials
2. Verify environment variables loaded: `console.log(process.env.CLOUDINARY_CLOUD_NAME)`
3. Restart server: `npm run dev`

---

### Issue: "Failed to upload image"

**Causes:**
- File too large (> 5MB)
- Invalid format (only jpg, jpeg, png, gif, webp allowed)
- Cloudinary API error

**Debug:**
```javascript
console.error('Upload error:', error);
// Check error type and message
```

---

### Issue: "Invalid file format"

**Solution:**
- Check file extension
- Allowed formats: jpg, jpeg, png, gif, webp
- Update `.env` if need different formats

```env
ALLOWED_FORMATS=jpg,jpeg,png,gif,webp
```

---

### Issue: Old image not deleted on update

**Solution:**
- Check if URL extraction works
- Verify Cloudinary API credentials
- Check logs for deletion errors (non-critical)

---

## 🔐 Security Best Practices

### 1. **Environment Variables**
```
✓ NEVER commit .env to git
✓ Use .gitignore to exclude .env
✓ Regenerate API_SECRET if leaked
✓ Use different credentials for dev/prod
```

### 2. **File Upload Validation**
```
✓ Validate file size (multer)
✓ Whitelist file formats
✓ Check MIME types
✓ Scan for malware (optional - external service)
```

### 3. **URL Security**
```
✓ Always use HTTPS URLs from Cloudinary
✓ Implement CORS if frontend on different domain
✓ Add rate limiting for uploads
```

### 4. **Resource Access**
```
✓ Verify user owns resource before allowing upload
✓ Only admins can upload category/product images
✓ Users can only upload their own avatar
✓ Implement request signing for sensitive operations
```

---

## 📈 Performance Optimization

### Cloudinary CDN Benefits

```
✓ Global distribution (faster download)
✓ Automatic format conversion
✓ Responsive image sizing
✓ Lazy loading support
✓ Caching headers
```

### Image URL Options

**Resize example:**
```
https://res.cloudinary.com/cloud/image/upload/
  w_300,h_200,c_fill/  <!-- Resize to 300x200 -->
  grocery/products/product.jpg
```

**Quality optimization:**
```
https://res.cloudinary.com/cloud/image/upload/
  w_300,q_auto:best/  <!-- Auto quality optimization -->
  grocery/products/product.jpg
```

---

## 🚀 Production Deployment

### Before Going Live

- [ ] Create production Cloudinary account
- [ ] Update `.env` with production credentials
- [ ] Test all upload endpoints
- [ ] Monitor Cloudinary dashboard
- [ ] Setup error logging
- [ ] Enable CORS for production domain
- [ ] Test image deletion
- [ ] Verify HTTPS URLs

### Monitoring

```javascript
// Log upload success
console.log(`Image uploaded: ${imageUrl}`);

// Monitor Cloudinary quota
// View dashboard: https://cloudinary.com/console/
```

---

## 📝 Changelog

**Phase 5 Update:**
- Added `avatar_url` to users table
- Added `image_url` to categories table
- Added `image_url` to products table
- Integrated Cloudinary for image storage
- Added multer middleware for file validation
- Created image upload endpoints
- Implemented auto-delete on update/delete
- Added comprehensive error handling

