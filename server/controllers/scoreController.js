const Score = require('../models/Score');

/**
 * List scores with pagination and filters
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
    if (req.query.match) {
      query.match = req.query.match;
    }

    const total = await Score.countDocuments(query);
    const scores = await Score.find(query)
      .populate('match tournament')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .sort('-updatedAt')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: scores,
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
 * Get score details by match ID
 */
exports.detail = async (req, res, next) => {
  try {
    const score = await Score.findOne({ match: req.params.id })
      .populate('match tournament')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: score
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create score log (usually created automatically with match)
 */
exports.create = async (req, res, next) => {
  try {
    const { match, tournament, team1, team2, score1, score2 } = req.body;

    const exists = await Score.findOne({ match });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Score details already initialized for this match'
      });
    }

    const score = await Score.create({
      match,
      tournament,
      team1,
      team2,
      score1: parseInt(score1, 10) || 0,
      score2: parseInt(score2, 10) || 0
    });

    res.status(201).json({
      success: true,
      data: score
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update score log
 */
exports.update = async (req, res, next) => {
  try {
    const { score1, score2 } = req.body;

    const score = await Score.findOneAndUpdate(
      { match: req.params.id },
      {
        score1: score1 !== undefined ? parseInt(score1, 10) : undefined,
        score2: score2 !== undefined ? parseInt(score2, 10) : undefined
      },
      { new: true }
    );

    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: score
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete score log
 */
exports.delete = async (req, res, next) => {
  try {
    const score = await Score.findOneAndDelete({ match: req.params.id });
    if (!score) {
      return res.status(404).json({
        success: false,
        message: 'Score record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Score record deleted'
    });
  } catch (error) {
    next(error);
  }
};
