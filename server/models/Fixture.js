const mongoose = require('mongoose');

const FixtureSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    round: {
      type: Number,
      required: true
    },
    matchNumber: {
      type: Number,
      required: true
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: false, // can be null initially, updated when match is created
      default: null
    },
    team1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false, // can be null initially in knockouts (e.g. TBD)
      default: null
    },
    team2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
      default: null
    },
    scheduledAt: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Fixture', FixtureSchema);
