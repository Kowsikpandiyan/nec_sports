const User = require('../models/User');

/**
 * List all users with filtering, sorting, searching, and pagination
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search filter
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Role filter
    if (req.query.role) {
      query.role = req.query.role;
    }

    // College filter
    if (req.query.college) {
      query.college = req.query.college;
    }

    // Active status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Sorting
    let sort = '-createdAt';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('college department')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed user record
 */
exports.detail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('college department');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user manually
 */
exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, college, department, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      college: college || null,
      department: department || null,
      phone
    });

    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, role, college, department, phone, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.name = name !== undefined ? name : user.name;
    user.role = role !== undefined ? role : user.role;
    user.college = college !== undefined ? (college || null) : user.college;
    user.department = department !== undefined ? (department || null) : user.department;
    user.phone = phone !== undefined ? phone : user.phone;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    await user.save();

    const userResponse = await User.findById(user._id).populate('college department');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete/Deactivate user
 */
exports.delete = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Do not allow deleting self
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User account removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
