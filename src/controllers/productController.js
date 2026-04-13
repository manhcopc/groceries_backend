const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinaryUtils');

exports.create = async (req, res) => {
  try {
    const { name, price, stock_quantity, category_id, description } = req.body;

    if (!name || !price || stock_quantity === undefined || !category_id) {
      return res.status(400).json({ message: 'Name, price, stock_quantity, and category_id are required' });
    }

    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let imageUrl = null;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/products'
        );
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload image' });
      }
    }

    const result = await Product.create(
      name,
      price,
      stock_quantity,
      category_id,
      description || '',
      imageUrl
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.id,
      imageUrl
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({
      message: 'Products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.findByCategory(categoryId);
    res.json({
      message: 'Products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock_quantity, category_id, description } = req.body;

    if (!name || !price || stock_quantity === undefined || !category_id) {
      return res.status(400).json({ message: 'Name, price, stock_quantity, and category_id are required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let imageUrl = product.image_url;

    if (req.file) {
      try {
        if (product.image_url) {
          const oldPublicId = extractPublicIdFromUrl(product.image_url);
          if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
          }
        }

        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/products'
        );
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload image' });
      }
    }

    const result = await Product.update(
      id,
      name,
      price,
      stock_quantity,
      category_id,
      description || '',
      imageUrl
    );

    res.json({
      message: 'Product updated successfully',
      affectedRows: result.rowCount,
      imageUrl
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_change } = req.body;

    if (quantity_change === undefined) {
      return res.status(400).json({ message: 'quantity_change is required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newStock = product.stock_quantity + quantity_change;
    if (newStock < 0) {
      return res.status(400).json({ message: 'Insufficient stock. Cannot reduce stock below 0' });
    }

    const result = await Product.updateStock(id, quantity_change);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Failed to update stock' });
    }

    res.json({
      message: 'Product stock updated successfully',
      affectedRows: result.rowCount,
      newStock: newStock
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.image_url) {
      try {
        const oldPublicId = extractPublicIdFromUrl(product.image_url);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      } catch (deleteError) {
        console.error('Old image deletion warning:', deleteError);
      }
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'grocery/products'
    );

    await Product.updateImageUrl(id, uploadResult.secure_url);

    res.json({
      message: 'Product image uploaded successfully',
      imageUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.image_url) {
      try {
        const publicId = extractPublicIdFromUrl(product.image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Image deletion warning:', deleteError);
      }
    }

    const result = await Product.delete(id);

    res.json({
      message: 'Product deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
