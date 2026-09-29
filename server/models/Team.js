const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }
    ],
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    viceCaptain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    coach: {
      type: String,
      required: [true, 'Coach name is required']
    },
    photo: {
      type: String,
      default: ''
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Ensure that a department can only submit one team per tournament
TeamSchema.index({ tournament: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Team', TeamSchema);
