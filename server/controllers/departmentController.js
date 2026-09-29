const Department = require('../models/Department');
const Player = require('../models/Player');
const Team = require('../models/Team');
const User = require('../models/User');
const { uploadImage } = require('../config/cloudinary');
const { recalculateGlobalDepartmentLeaderboard } = require('../utils/leaderboardHelper');

/**
 * List all departments
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

    if (req.query.college) {
      query.college = req.query.college;
    }

    let sort = 'name';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Department.countDocuments(query);
    const departments = await Department.find(query)
      .populate('college')
      .populate('captain')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Dynamic count injection for players & teams
    const enrichedDepts = await Promise.all(
      departments.map(async (dept) => {
        const playerCount = await Player.countDocuments({ department: dept._id });
        const teamCount = await Team.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          playerCount,
          teamCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedDepts,
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
 * Get department details
 */
exports.detail = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('college')
      .populate('captain');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new department + auto-create coordinator login account
 */
exports.create = async (req, res, next) => {
  try {
    const {
      name, college, coordinatorName, coachName, captain,
      description, coordinatorEmail, coordinatorPassword
    } = req.body;

    // Validate coordinator credentials are provided
    if (!coordinatorEmail || !coordinatorPassword) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator email and password are required to create a login account'
      });
    }

    if (coordinatorPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator password must be at least 6 characters'
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: coordinatorEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user account with email "${coordinatorEmail}" already exists. Please use a different email.`
      });
    }

    // Upload logo if provided
    let logoUrl = '';
    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'departments');
      if (uploadResult) {
        logoUrl = uploadResult.url;
      }
    }

    // Create the department
    const department = await Department.create({
      name,
      college,
      coordinatorName,
      coachName: coachName || '',
      captain: captain || null,
      description: description || '',
      logo: logoUrl
    });

    // Auto-create coordinator login account linked to this department
    const coordinatorUser = await User.create({
      name: coordinatorName,
      email: coordinatorEmail.toLowerCase().trim(),
      password: coordinatorPassword,
      role: 'coordinator',
      college: college || null,
      department: department._id
    });

    // Trigger leaderboard recalculation to include the new department
    await recalculateGlobalDepartmentLeaderboard();

    res.status(201).json({
      success: true,
      message: 'Department created and coordinator account set up successfully',
      data: department,
      coordinatorAccount: {
        name: coordinatorUser.name,
        email: coordinatorUser.email,
        role: coordinatorUser.role,
        department: department.name
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Update department details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, college, coordinatorName, coachName, captain, description } = req.body;
    const updateData = {
      name,
      college,
      coordinatorName,
      coachName,
      description
    };

    if (captain) {
      updateData.captain = captain;
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'departments');
      if (uploadResult) {
        updateData.logo = uploadResult.url;
      }
    }

    const department = await Department.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('college captain');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Trigger leaderboard recalculation to update department name/info in standings
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a department
 */
exports.delete = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    // Trigger leaderboard recalculation to remove the deleted department from standings
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/departments/:id/players → all players in department
 */
exports.getPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ department: req.params.id }).populate('sports');
    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/departments/:id/teams → all teams in department
 */
exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ department: req.params.id }).populate('tournament');
    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};
