const College = require('../models/College');
const { uploadImage } = require('../config/cloudinary');

/**
 * List all colleges
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    let sort = '-createdAt';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await College.countDocuments(query);
    const colleges = await College.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: colleges,
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
 * Get college details
 */
exports.detail = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id).populate('createdBy', 'name email');
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      data: college
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new college profile
 */
exports.create = async (req, res, next) => {
  try {
    const { name, address, phone, email, website, establishedYear } = req.body;
    let logoUrl = '';

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'colleges');
      if (uploadResult) {
        logoUrl = uploadResult.url;
      }
    }

    const college = await College.create({
      name,
      address,
      phone,
      email,
      website,
      establishedYear,
      logo: logoUrl,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update college profile
 */
exports.update = async (req, res, next) => {
  try {
    const { name, address, phone, email, website, establishedYear } = req.body;
    const updateData = { name, address, phone, email, website, establishedYear };

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'colleges');
      if (uploadResult) {
        updateData.logo = uploadResult.url;
      }
    }

    const college = await College.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'College details updated successfully',
      data: college
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a college profile
 */
exports.delete = async (req, res, next) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    await College.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'College record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
