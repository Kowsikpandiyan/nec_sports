const aiPredictionService = require('../services/aiPredictionService');
const Match = require('../models/Match');
const Team = require('../models/Team');

/**
 * @desc    Predict match outcome and winner for a match
 * @route   GET /api/v1/ai-predict/match/:matchId
 * @access  Public
 */
exports.predictMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }

    const prediction = await aiPredictionService.predictMatchWinner(matchId);

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      message: error.message || 'Error calculating AI match prediction'
    });
  }
};

/**
 * @desc    Simulate match prediction between two teams
 * @route   POST /api/v1/ai-predict/simulate
 * @access  Public
 */
exports.simulateMatch = async (req, res, next) => {
  try {
    const { team1Id, team2Id, sportId } = req.body;

    if (!team1Id || !team2Id) {
      return res.status(400).json({
        success: false,
        message: 'Both team1Id and team2Id are required'
      });
    }

    const [team1, team2] = await Promise.all([
      Team.findById(team1Id).populate('department').populate('captain'),
      Team.findById(team2Id).populate('department').populate('captain')
    ]);

    if (!team1 || !team2) {
      return res.status(404).json({
        success: false,
        message: 'One or both teams not found'
      });
    }

    const prediction = await aiPredictionService.calculatePrediction(team1, team2, sportId);

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error simulating prediction'
    });
  }
};

/**
 * @desc    Get AI Prediction Model metadata and feature explanation
 * @route   GET /api/v1/ai-predict/info
 * @access  Public
 */
exports.getModelInfo = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      modelName: "Sports AI Match Outcome & Winner Predictor",
      version: "2.0.0",
      architecture: "Multi-Factor Probabilistic Sigmoid Ensemble",
      features: [
        { name: "Historical Win Rate Difference", weight: 2.2, description: "Normalized win ratio across all tournament records" },
        { name: "Recent Form Momentum", weight: 1.8, description: "Weighted rolling win streak over last 5 matches" },
        { name: "Head-to-Head Encounters", weight: 1.5, description: "Direct historical matchup record between the two teams" },
        { name: "Scoring Power Differential", weight: 1.2, description: "Average points/goals scored per match in the sport" },
        { name: "Roster Depth & Squad Size", weight: 0.5, description: "Number of registered active squad members" }
      ],
      status: "Active & Ready"
    }
  });
};
