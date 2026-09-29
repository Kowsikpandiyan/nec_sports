const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');
const Department = require('../models/Department');
const DepartmentPoints = require('../models/DepartmentPoints');

const { exportTournamentPDF, exportDepartmentRankingPDF } = require('../utils/pdfExport');
const { exportTournamentExcel } = require('../utils/excelExport');

/**
 * GET /api/v1/reports/tournament/:id/pdf → stream PDF
 */
exports.getTournamentPDF = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('sport venue');
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const matches = await Match.find({ tournament: tournament._id })
      .populate('venue')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate('winner')
      .sort('scheduledAt');

    const teams = await Team.find({ tournament: tournament._id, isApproved: true })
      .populate('department captain');

    const pdfBuffer = await exportTournamentPDF(tournament, matches, teams);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${tournament.name.replace(/\s+/g, '_')}_Report.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/tournament/:id/excel → stream Excel
 */
exports.getTournamentExcel = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('sport venue');
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const matches = await Match.find({ tournament: tournament._id })
      .populate('venue')
      .populate({
        path: 'team1 team2',
        populate: { path: 'department' }
      })
      .populate('winner')
      .sort('scheduledAt');

    const teams = await Team.find({ tournament: tournament._id, isApproved: true })
      .populate('department captain');

    const excelBuffer = await exportTournamentExcel({ tournament, matches, teams });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${tournament.name.replace(/\s+/g, '_')}_Report.xlsx"`,
      'Content-Length': excelBuffer.length
    });

    res.status(200).send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/departments/pdf → stream Department rankings PDF
 */
exports.getDepartmentRankingsPDF = async (req, res, next) => {
  try {
    const standings = await DepartmentPoints.find({})
      .populate('department')
      .sort({ totalPoints: -1, matchesWon: -1 });

    const pdfBuffer = await exportDepartmentRankingPDF(standings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Department_Leaderboard_Rankings.pdf"',
      'Content-Length': pdfBuffer.length
    });

    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
