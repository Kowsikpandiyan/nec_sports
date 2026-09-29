const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Fixture = require('../models/Fixture');
const Match = require('../models/Match');
const { uploadImage } = require('../config/cloudinary');
const { generateKnockout, generateLeague } = require('../utils/generateFixtures');
const { recalculateGlobalDepartmentLeaderboard } = require('../utils/leaderboardHelper');

/**
 * List all tournaments
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

    if (req.query.sport) {
      query.sport = req.query.sport;
    }

    if (req.query.college) {
      query.college = req.query.college;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    let sort = '-startDate';
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const total = await Tournament.countDocuments(query);
    const tournaments = await Tournament.find(query)
      .populate('sport college venue')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: tournaments,
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
 * Get tournament details
 */
exports.detail = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('sport college venue createdBy');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create tournament
 */
exports.create = async (req, res, next) => {
  try {
    const { name, sport, college, startDate, endDate, venue, format, rules } = req.body;
    let bannerUrl = '';

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'tournaments');
      if (uploadResult) {
        bannerUrl = uploadResult.url;
      }
    }

    const tournament = await Tournament.create({
      name,
      sport,
      college,
      startDate,
      endDate,
      venue,
      format,
      rules: rules || '',
      banner: bannerUrl,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tournament details
 */
exports.update = async (req, res, next) => {
  try {
    const { name, sport, college, startDate, endDate, venue, format, rules, status } = req.body;
    const updateData = { name, sport, college, startDate, endDate, venue, format, rules, status };

    if (req.file) {
      const uploadResult = await uploadImage(req.file.path, 'tournaments');
      if (uploadResult) {
        updateData.banner = uploadResult.url;
      }
    }

    const tournament = await Tournament.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Recalculate leaderboard points (handles champion/runner up bonus points if completed)
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Tournament details updated successfully',
      data: tournament
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete tournament
 */
exports.delete = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Clean up corresponding fixtures/matches/teams
    await Fixture.deleteMany({ tournament: req.params.id });
    await Match.deleteMany({ tournament: req.params.id });
    await Team.deleteMany({ tournament: req.params.id });

    await Tournament.findByIdAndDelete(req.params.id);

    // Recalculate leaderboard points
    await recalculateGlobalDepartmentLeaderboard();

    res.status(200).json({
      success: true,
      message: 'Tournament and all associated schedules deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tournaments/:id/generate-fixtures
 */
exports.generateFixtures = async (req, res, next) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Verify if fixtures already generated
    const existingFixturesCount = await Fixture.countDocuments({ tournament: tournamentId });
    if (existingFixturesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixtures have already been generated for this tournament'
      });
    }

    // Find approved teams
    const teams = await Team.find({ tournament: tournamentId, isApproved: true });
    if (teams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 approved teams to generate matchups'
      });
    }

    const teamIds = teams.map((t) => t._id);
    let generatedList = [];

    if (tournament.format === 'knockout') {
      generatedList = generateKnockout(teamIds);
    } else {
      generatedList = generateLeague(teamIds); // Handles 'league' and 'roundRobin'
    }

    const savedFixtures = [];

    // Create match and fixture records
    for (const item of generatedList) {
      let linkedMatchId = null;

      // Only create Match documents if both teams are known (or if we create placeholders for knockout)
      // Since knockout generatedList returns teams as null for future rounds,
      // we pre-create matches for all fixtures to support the tournament bracket visually.
      const match = await Match.create({
        tournament: tournamentId,
        sport: tournament.sport,
        round: item.round.toString(),
        team1: item.team1 || null,
        team2: item.team2 || null,
        venue: tournament.venue,
        scheduledAt: tournament.startDate,
        scorer: req.user.id
      });
      linkedMatchId = match._id;

      const fixture = await Fixture.create({
        tournament: tournamentId,
        round: item.round,
        matchNumber: item.matchNumber,
        match: linkedMatchId,
        team1: item.team1 || null,
        team2: item.team2 || null,
        scheduledAt: tournament.startDate
      });

      savedFixtures.push(fixture);
    }

    // Populate saved fixtures to return
    const populated = await Fixture.find({ tournament: tournamentId })
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate({
        path: 'match',
        populate: { path: 'team1 team2' }
      });

    // Mark tournament status as ongoing
    tournament.status = 'ongoing';
    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Fixtures and matches generated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tournaments/:id/bracket
 */
exports.getBracket = async (req, res, next) => {
  try {
    const tournamentId = req.params.id;

    const fixtures = await Fixture.find({ tournament: tournamentId })
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate({
        path: 'match',
        populate: [
          { path: 'team1 team2', populate: { path: 'department' } },
          { path: 'winner', populate: { path: 'department' } }
        ]
      })
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({
      success: true,
      data: fixtures
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tournaments/:id/points-table
 */
exports.getPointsTable = async (req, res, next) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const teams = await Team.find({ tournament: tournamentId, isApproved: true })
      .populate('department');

    const completedMatches = await Match.find({
      tournament: tournamentId,
      status: 'completed'
    });

    // Initialize standings dictionary
    const standings = {};
    teams.forEach((t) => {
      standings[t._id.toString()] = {
        teamId: t._id,
        department: t.department.name,
        logo: t.department.logo || '',
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
    });

    // Process completed matches
    completedMatches.forEach((m) => {
      const t1Id = m.team1 ? m.team1.toString() : null;
      const t2Id = m.team2 ? m.team2.toString() : null;

      // Ignore if teams are not registered anymore or not found
      if (!t1Id || !t2Id || !standings[t1Id] || !standings[t2Id]) return;

      standings[t1Id].played += 1;
      standings[t2Id].played += 1;

      standings[t1Id].goalsFor += m.score1;
      standings[t1Id].goalsAgainst += m.score2;

      standings[t2Id].goalsFor += m.score2;
      standings[t2Id].goalsAgainst += m.score1;

      if (m.score1 > m.score2) {
        standings[t1Id].won += 1;
        standings[t1Id].points += 3;
        standings[t2Id].lost += 1;
      } else if (m.score2 > m.score1) {
        standings[t2Id].won += 1;
        standings[t2Id].points += 3;
        standings[t1Id].lost += 1;
      } else {
        standings[t1Id].drawn += 1;
        standings[t1Id].points += 1;
        standings[t2Id].drawn += 1;
        standings[t2Id].points += 1;
      }
    });

    // Calculate Goal Difference and format array
    const standingsList = Object.values(standings).map((s) => {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
      return s;
    });

    // Sort standings: Points desc -> GD desc -> GF desc
    standingsList.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      return b.goalsFor - a.goalsFor;
    });

    res.status(200).json({
      success: true,
      data: standingsList
    });
  } catch (error) {
    next(error);
  }
};
