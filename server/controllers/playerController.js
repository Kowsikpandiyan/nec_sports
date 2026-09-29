const Player = require('../models/Player');
const Match = require('../models/Match');
const { uploadImage } = require('../config/cloudinary');

/**
 * List all players with filter queries, pagination, search, and populate
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search query (player name or roll number)
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { rollNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filters
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.college) {
      query.college = req.query.college;
    }
    if (req.query.sport) {
      query.sports = req.query.sport; // matches if sport ID is in sports array
    }

    let sort = '-createdAt';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Player.countDocuments(query);
    const players = await Player.find(query)
      .populate('department college sports')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: players,
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
 * Get player details + match history
 */
exports.detail = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('department college sports');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Find matches where they could have participated
    // To keep it simple, we find matches in which their department's team played
    const teams = await require('../models/Team').find({ players: player._id });
    const teamIds = teams.map(t => t._id);

    const matches = await Match.find({
      $or: [
        { team1: { $in: teamIds } },
        { team2: { $in: teamIds } }
      ]
    }).populate({
      path: 'team1 team2',
      populate: { path: 'department' }
    }).populate('tournament');

    res.status(200).json({
      success: true,
      data: {
        player,
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new player athlete
 */
exports.create = async (req, res, next) => {
  try {
    const { name, rollNumber, department, college, age, phone, email, position, jerseyNumber, sports } = req.body;
    let photoUrl = '';

    // Handle photo file upload
    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'players');
      if (uploadResult) {
        photoUrl = uploadResult.url;
      }
    }

    // Parse sports if sent as stringified array
    let sportsArray = sports;
    if (typeof sports === 'string') {
      try {
        sportsArray = JSON.parse(sports);
      } catch (e) {
        sportsArray = sports.split(',').map(s => s.trim());
      }
    }

    // Create player record
    const player = new Player({
      name,
      rollNumber,
      department,
      college,
      age,
      phone,
      email,
      position,
      jerseyNumber,
      sports: sportsArray || [],
      photo: photoUrl
    });

    await player.save();

    const populatedPlayer = await Player.findById(player._id).populate('department college sports');

    res.status(201).json({
      success: true,
      message: 'Player registered successfully',
      data: populatedPlayer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update player details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, rollNumber, department, college, age, phone, email, position, jerseyNumber, sports, isActive } = req.body;

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Update details
    player.name = name !== undefined ? name : player.name;
    player.rollNumber = rollNumber !== undefined ? rollNumber : player.rollNumber;
    player.department = department !== undefined ? department : player.department;
    player.college = college !== undefined ? college : player.college;
    player.age = age !== undefined ? age : player.age;
    player.phone = phone !== undefined ? phone : player.phone;
    player.email = email !== undefined ? email : player.email;
    player.position = position !== undefined ? position : player.position;
    player.jerseyNumber = jerseyNumber !== undefined ? jerseyNumber : player.jerseyNumber;
    player.isActive = isActive !== undefined ? isActive : player.isActive;

    if (sports !== undefined) {
      let sportsArray = sports;
      if (typeof sports === 'string') {
        try {
          sportsArray = JSON.parse(sports);
        } catch (e) {
          sportsArray = sports.split(',').map(s => s.trim());
        }
      }
      player.sports = sportsArray;
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'players');
      if (uploadResult) {
        player.photo = uploadResult.url;
      }
    }

    await player.save();

    const populatedPlayer = await Player.findById(player._id).populate('department college sports');

    res.status(200).json({
      success: true,
      message: 'Player details updated successfully',
      data: populatedPlayer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete player profile
 */
exports.delete = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    await Player.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Player removed successfully'
    });
  } catch (error) {
    next(error);
  }
};



/**
 * GET /api/v1/players/department/:deptId → players by department
 */
exports.getByDepartment = async (req, res, next) => {
  try {
    const players = await Player.find({ department: req.params.deptId }).populate('sports');
    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    next(error);
  }
};
