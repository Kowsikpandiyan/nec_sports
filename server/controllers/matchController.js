const Match = require('../models/Match');
const Score = require('../models/Score');
const Fixture = require('../models/Fixture');
const Notification = require('../models/Notification');
const { emitToMatch, broadcastGlobal } = require('../socket/socket');
const { recalculateGlobalDepartmentLeaderboard } = require('../utils/leaderboardHelper');

// Progression helper for knockout brackets
const progressKnockout = async (match) => {
  try {
    const { tournament, round, winner } = match;
    if (!winner) return; // Draws do not progress in knockouts

    // Find the fixture corresponding to this match
    const fixture = await Fixture.findOne({ tournament, match: match._id });
    if (!fixture) return;

    const currentRound = fixture.round;
    const currentMatchNum = fixture.matchNumber;

    const nextRound = currentRound + 1;
    const nextMatchNum = Math.ceil(currentMatchNum / 2);
    const isTeam1 = currentMatchNum % 2 !== 0; // odd number fills team1 slot, even fills team2 slot

    // Find the placeholder fixture in the next round
    const nextFixture = await Fixture.findOne({
      tournament,
      round: nextRound,
      matchNumber: nextMatchNum
    });

    if (nextFixture) {
      if (isTeam1) {
        nextFixture.team1 = winner;
      } else {
        nextFixture.team2 = winner;
      }
      await nextFixture.save();

      // If a match was already pre-created for this next round, update its team slot
      if (nextFixture.match) {
        const updateParams = {};
        if (isTeam1) {
          updateParams.team1 = winner;
        } else {
          updateParams.team2 = winner;
        }
        await Match.findByIdAndUpdate(nextFixture.match, updateParams);
      }
    }
  } catch (err) {
    console.error('Failed to progress knockout bracket:', err.message);
  }
};

/**
 * List matches with search, sort, filters, and pagination
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
    if (req.query.sport) {
      query.sport = req.query.sport;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.scorer) {
      query.scorer = req.query.scorer;
    }

    let sort = 'scheduledAt';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Match.countDocuments(query);
    const matches = await Match.find(query)
      .populate('tournament sport venue scorer winner')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: matches,
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
 * Get detailed match report + timeline
 */
exports.detail = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament sport venue scorer winner')
      .populate({
        path: 'team1 team2',
        populate: [{ path: 'department' }, { path: 'players' }]
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a match manually
 */
exports.create = async (req, res, next) => {
  try {
    const { tournament, sport, round, team1, team2, venue, scheduledAt, scorer, referee } = req.body;

    const match = await Match.create({
      tournament,
      sport,
      round,
      team1: team1 || null,
      team2: team2 || null,
      venue,
      scheduledAt,
      scorer,
      referee: referee || ''
    });

    // Create a detailed score log record linked to this match
    await Score.create({
      match: match._id,
      tournament,
      team1: team1 || null,
      team2: team2 || null,
      score1: 0,
      score2: 0
    });

    res.status(201).json({
      success: true,
      message: 'Match scheduled successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update match details
 */
exports.update = async (req, res, next) => {
  try {
    const { round, team1, team2, venue, scheduledAt, scorer, referee, score1, score2, status, winner } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    match.round = round !== undefined ? round : match.round;
    match.team1 = team1 !== undefined ? (team1 || null) : match.team1;
    match.team2 = team2 !== undefined ? (team2 || null) : match.team2;
    match.venue = venue !== undefined ? venue : match.venue;
    match.scheduledAt = scheduledAt !== undefined ? scheduledAt : match.scheduledAt;
    match.scorer = scorer !== undefined ? scorer : match.scorer;
    match.referee = referee !== undefined ? referee : match.referee;
    match.score1 = score1 !== undefined ? parseInt(score1, 10) : match.score1;
    match.score2 = score2 !== undefined ? parseInt(score2, 10) : match.score2;
    match.status = status !== undefined ? status : match.status;
    match.winner = winner !== undefined ? (winner || null) : match.winner;

    await match.save();

    // Keep Score record synchronized
    await Score.findOneAndUpdate(
      { match: match._id },
      {
        team1: match.team1,
        team2: match.team2,
        score1: match.score1,
        score2: match.score2
      }
    );

    // If completed, trigger knockout progression
    if (match.status === 'completed') {
      await progressKnockout(match);
    }

    // Trigger leaderboard points recalculation
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Match details updated successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a match schedule
 */
exports.delete = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    await Score.deleteOne({ match: req.params.id });
    await Match.findByIdAndDelete(req.params.id);

    // Trigger leaderboard points recalculation
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Match details deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/matches/:id/score
 */
exports.updateScore = async (req, res, next) => {
  try {
    const { score1, score2 } = req.body;
    const parsedScore1 = parseInt(score1, 10) || 0;
    const parsedScore2 = parseInt(score2, 10) || 0;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { score1: parsedScore1, score2: parsedScore2 },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Update Score document
    await Score.findOneAndUpdate(
      { match: match._id },
      { score1: parsedScore1, score2: parsedScore2 }
    );

    // Emit live socket update
    emitToMatch(match._id.toString(), 'score:update', {
      matchId: match._id.toString(),
      score1: parsedScore1,
      score2: parsedScore2,
      updatedAt: new Date()
    });

    // Trigger leaderboard points recalculation
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/matches/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, winnerId } = req.body;

    const match = await Match.findById(req.params.id).populate('team1 team2');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    match.status = status;

    if (status === 'completed') {
      let winner = null;
      if (winnerId && winnerId !== 'draw') {
        winner = winnerId;
      } else if (winnerId === 'draw') {
        winner = null;
      } else {
        // Auto resolve winner
        if (match.score1 > match.score2) winner = match.team1._id;
        else if (match.score2 > match.score1) winner = match.team2._id;
      }
      match.winner = winner;
    }

    await match.save();

    // If status is completed, trigger knockout progression
    if (status === 'completed') {
      await progressKnockout(match);
    }

    // Emit socket update
    emitToMatch(match._id.toString(), 'match:status', {
      matchId: match._id.toString(),
      status,
      winner: match.winner
    });

    // Create Notification and broadcast if completed
    if (status === 'completed') {
      const pMatch = await Match.findById(match._id).populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      });
      const t1 = pMatch.team1?.department?.name || 'Team 1';
      const t2 = pMatch.team2?.department?.name || 'Team 2';

      const title = `Match Completed: ${t1} vs ${t2}`;
      const msg = `The game concluded. Score: ${match.score1} - ${match.score2}.`;

      await Notification.create({
        type: 'matchFinished',
        title,
        message: msg,
        relatedMatch: match._id,
        relatedTournament: match.tournament
      });

      broadcastGlobal('notification:push', {
        type: 'matchFinished',
        title,
        message: msg,
        relatedMatch: match._id,
        relatedTournament: match.tournament
      });
    }

    // Trigger leaderboard points recalculation
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: `Match status updated to ${status}`,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/matches/live
 */
exports.getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .populate('tournament sport venue winner')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .sort('scheduledAt');

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/matches/upcoming
 */
exports.getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'scheduled' })
      .populate('tournament sport venue winner')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .sort('scheduledAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};
