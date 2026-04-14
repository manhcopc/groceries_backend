const Category = require('../models/Category');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinaryUtils');

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    // console.log('Create category request body:', req.body);
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    let imageUrl = null;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/categories'
        );
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload image' });
      }
    }

    const result = await Category.create(name, description || '', imageUrl);

    res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.id,
      imageUrl
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let imageUrl = category.image_url;

    if (req.file) {
      try {
        if (category.image_url) {
          const oldPublicId = extractPublicIdFromUrl(category.image_url);
          if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
          }
        }

        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/categories'
        );
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload image' });
      }
    }

    const result = await Category.update(id, name, description || '', imageUrl);

    res.json({
      message: 'Category updated successfully',
      affectedRows: result.rowCount,
      imageUrl
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.uploadCategoryImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.image_url) {
      try {
        const oldPublicId = extractPublicIdFromUrl(category.image_url);
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
      'grocery/categories'
    );

    await Category.updateImageUrl(id, uploadResult.secure_url);

    res.json({
      message: 'Category image uploaded successfully',
      imageUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Upload category image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.image_url) {
      try {
        const publicId = extractPublicIdFromUrl(category.image_url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Image deletion warning:', deleteError);
      }
    }

    const result = await Category.delete(id);

    res.json({
      message: 'Category deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
