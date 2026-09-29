const Sport = require('../models/Sport');

/**
 * List all sports
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

    const total = await Sport.countDocuments(query);
    const sports = await Sport.find(query)
      .sort('name')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: sports,
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
 * Get sport details
 */
exports.detail = async (req, res, next) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sport
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a sport
 */
exports.create = async (req, res, next) => {
  try {
    const { name, icon, description, maxPlayersPerTeam, eventTypes } = req.body;

    const sportExists = await Sport.findOne({ name });
    if (sportExists) {
      return res.status(400).json({
        success: false,
        message: `Sport with name '${name}' already exists`
      });
    }

    let parsedEventTypes = eventTypes;
    if (typeof eventTypes === 'string') {
      try {
        parsedEventTypes = JSON.parse(eventTypes);
      } catch (e) {
        parsedEventTypes = eventTypes.split(',').map(item => item.trim());
      }
    }

    const sport = await Sport.create({
      name,
      icon,
      description,
      maxPlayersPerTeam,
      eventTypes: parsedEventTypes || []
    });

    res.status(201).json({
      success: true,
      message: 'Sport created successfully',
      data: sport
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sport details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, icon, description, maxPlayersPerTeam, eventTypes } = req.body;
    const updateData = { name, icon, description, maxPlayersPerTeam };

    if (eventTypes !== undefined) {
      let parsedEventTypes = eventTypes;
      if (typeof eventTypes === 'string') {
        try {
          parsedEventTypes = JSON.parse(eventTypes);
        } catch (e) {
          parsedEventTypes = eventTypes.split(',').map(item => item.trim());
        }
      }
      updateData.eventTypes = parsedEventTypes;
    }

    const sport = await Sport.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sport details updated successfully',
      data: sport
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sport
 */
exports.delete = async (req, res, next) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport not found'
      });
    }

    await Sport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sport deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
