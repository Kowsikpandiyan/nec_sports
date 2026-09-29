const Venue = require('../models/Venue');

/**
 * List venues
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.college) {
      query.college = req.query.college;
    }
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Venue.countDocuments(query);
    const venues = await Venue.find(query)
      .populate('college')
      .sort('name')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: venues,
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
 * Get venue details
 */
exports.detail = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('college');
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create venue
 */
exports.create = async (req, res, next) => {
  try {
    const { name, location, capacity, amenities, college } = req.body;

    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = amenities.split(',').map(a => a.trim());
      }
    }

    const venue = await Venue.create({
      name,
      location,
      capacity: parseInt(capacity, 10) || 0,
      amenities: parsedAmenities || [],
      college
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update venue details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, location, capacity, amenities, college } = req.body;
    const updateData = { name, location, college };

    if (capacity !== undefined) {
      updateData.capacity = parseInt(capacity, 10) || 0;
    }

    if (amenities !== undefined) {
      let parsedAmenities = amenities;
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch (e) {
          parsedAmenities = amenities.split(',').map(a => a.trim());
        }
      }
      updateData.amenities = parsedAmenities;
    }

    const venue = await Venue.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venue details updated successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete venue
 */
exports.delete = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    await Venue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
