const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinaryUtils');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    let avatarUrl = null;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/avatars'
        );
        avatarUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload avatar' });
      }
    }

    const result = await User.create(username, password, 'user', avatarUrl);

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      avatarUrl
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.avatar_url) {
      try {
        const oldPublicId = extractPublicIdFromUrl(user.avatar_url);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      } catch (deleteError) {
        console.error('Old avatar deletion warning:', deleteError);
      }
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'grocery/avatars'
    );

    await User.updateAvatarUrl(req.userId, uploadResult.secure_url);

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let avatarUrl = user.avatar_url;

    if (req.file) {
      try {
        if (user.avatar_url) {
          const oldPublicId = extractPublicIdFromUrl(user.avatar_url);
          if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
          }
        }

        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          'grocery/avatars'
        );
        avatarUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload avatar' });
      }
    }

    if (avatarUrl) {
      await User.updateAvatarUrl(req.userId, avatarUrl);
    }

    res.json({
      message: 'Profile updated successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
