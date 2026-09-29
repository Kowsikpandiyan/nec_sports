const Fixture = require('../models/Fixture');

/**
 * List all fixtures with query options and sorting
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
    if (req.query.round) {
      query.round = parseInt(req.query.round, 10);
    }

    let sort = 'round matchNumber';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Fixture.countDocuments(query);
    const fixtures = await Fixture.find(query)
      .populate('tournament')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate({
        path: 'match',
        populate: 'venue'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: fixtures,
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
 * Get single fixture
 */
exports.detail = async (req, res, next) => {
  try {
    const fixture = await Fixture.findById(req.params.id)
      .populate('tournament')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate('match');

    if (!fixture) {
      return res.status(404).json({
        success: false,
        message: 'Fixture not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fixture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create fixture manually
 */
exports.create = async (req, res, next) => {
  try {
    const { tournament, round, matchNumber, match, team1, team2, scheduledAt } = req.body;

    const fixture = await Fixture.create({
      tournament,
      round,
      matchNumber,
      match: match || null,
      team1: team1 || null,
      team2: team2 || null,
      scheduledAt
    });

    res.status(201).json({
      success: true,
      message: 'Fixture created successfully',
      data: fixture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update fixture details
 */
exports.update = async (req, res, next) => {
  try {
    const { round, matchNumber, match, team1, team2, scheduledAt } = req.body;

    const fixture = await Fixture.findByIdAndUpdate(
      req.params.id,
      {
        round,
        matchNumber,
        match: match !== undefined ? (match || null) : undefined,
        team1: team1 !== undefined ? (team1 || null) : undefined,
        team2: team2 !== undefined ? (team2 || null) : undefined,
        scheduledAt
      },
      { new: true }
    );

    if (!fixture) {
      return res.status(404).json({
        success: false,
        message: 'Fixture not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fixture updated successfully',
      data: fixture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete fixture
 */
exports.delete = async (req, res, next) => {
  try {
    const fixture = await Fixture.findById(req.params.id);
    if (!fixture) {
      return res.status(404).json({
        success: false,
        message: 'Fixture not found'
      });
    }

    await Fixture.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Fixture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
