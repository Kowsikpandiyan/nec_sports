const DepartmentPoints = require('../models/DepartmentPoints');

/**
 * GET /api/v1/leaderboard/departments
 * Returns overall department rankings sorted by points desc, then matches won desc
 */
exports.getDepartmentPoints = async (req, res, next) => {
  try {
    const list = await DepartmentPoints.find({})
      .populate('department')
      .sort({ totalPoints: -1, matchesWon: -1 });

    // Filter out orphaned records where the department has been deleted
    const validList = list.filter((item) => item.department !== null);

    res.status(200).json({
      success: true,
      data: validList
    });
  } catch (error) {
    next(error);
  }
};
