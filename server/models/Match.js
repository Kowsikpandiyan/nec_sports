const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: true
    },
    round: {
      type: String,
      required: true
    },
    team1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
      default: null
    },
    team2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
      default: null
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed'],
      default: 'scheduled'
    },
    scorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    referee: {
      type: String,
      default: ''
    },
    score1: {
      type: Number,
      default: 0
    },
    score2: {
      type: Number,
      default: 0
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Match', MatchSchema);
