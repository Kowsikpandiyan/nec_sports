const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadImage } = require('../config/cloudinary');

/**
 * List all teams
 */
exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.tournament) {
      query.tournament = req.query.tournament;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.isApproved !== undefined) {
      query.isApproved = req.query.isApproved === 'true';
    }

    let sort = '-createdAt';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .populate('tournament department captain viceCaptain approvedBy')
      .populate({
        path: 'players',
        populate: { path: 'sports' }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: teams,
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
 * Get detailed team profile
 */
exports.detail = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('tournament department captain viceCaptain approvedBy')
      .populate({
        path: 'players',
        populate: { path: 'sports' }
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a team
 */
exports.create = async (req, res, next) => {
  try {
    const { tournament, department, players, captain, viceCaptain, coach } = req.body;
    let photoUrl = '';

    // Check if team already registered
    const existingTeam = await Team.findOne({ tournament, department });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'A team has already been registered for this department in this tournament'
      });
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'teams');
      if (uploadResult) {
        photoUrl = uploadResult.url;
      }
    }

    let parsedPlayers = players;
    if (typeof players === 'string') {
      try {
        parsedPlayers = JSON.parse(players);
      } catch (e) {
        parsedPlayers = players.split(',').map((p) => p.trim());
      }
    }

    const team = await Team.create({
      tournament,
      department,
      players: parsedPlayers,
      captain,
      viceCaptain,
      coach: coach || '',
      photo: photoUrl,
      isApproved: false // Requires superAdmin approval
    });

    res.status(201).json({
      success: true,
      message: 'Team registered successfully and is pending approval',
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update team
 */
exports.update = async (req, res, next) => {
  try {
    const { players, captain, viceCaptain, coach, isApproved } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (players !== undefined) {
      let parsedPlayers = players;
      if (typeof players === 'string') {
        try {
          parsedPlayers = JSON.parse(players);
        } catch (e) {
          parsedPlayers = players.split(',').map((p) => p.trim());
        }
      }
      team.players = parsedPlayers;
    }

    team.captain = captain !== undefined ? captain : team.captain;
    team.viceCaptain = viceCaptain !== undefined ? viceCaptain : team.viceCaptain;
    team.coach = coach !== undefined ? coach : team.coach;

    if (isApproved !== undefined && req.user.role === 'superAdmin') {
      team.isApproved = isApproved;
      if (isApproved) {
        team.approvedBy = req.user.id;
      }
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'teams');
      if (uploadResult) {
        team.photo = uploadResult.url;
      }
    }

    await team.save();
    const updated = await Team.findById(team._id)
      .populate('tournament department captain viceCaptain approvedBy')
      .populate('players');

    res.status(200).json({
      success: true,
      message: 'Team roster updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete team registration
 */
exports.delete = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Team registration removed'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/teams/:id/approve
 */
exports.approve = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('tournament department');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    team.isApproved = true;
    team.approvedBy = req.user.id;
    await team.save();

    // Find coordinator of the team's department to notify
    const coordinator = await User.findOne({
      role: 'coordinator',
      department: team.department._id
    });

    const notifTitle = 'Team Registration Approved';
    const notifMessage = `The roster submitted for department ${team.department.name} in tournament ${team.tournament.name} has been approved.`;

    await Notification.create({
      user: coordinator ? coordinator._id : null,
      type: 'teamApproved',
      title: notifTitle,
      message: notifMessage,
      relatedTournament: team.tournament._id
    });

    // Fire Socket IO notification update
    const { broadcastGlobal } = require('../socket/socket');
    broadcastGlobal('notification:push', {
      type: 'teamApproved',
      title: notifTitle,
      message: notifMessage,
      relatedTournament: team.tournament._id
    });

    res.status(200).json({
      success: true,
      message: 'Team approved successfully',
      data: team
    });
  } catch (error) {
    next(error);
  }
};
