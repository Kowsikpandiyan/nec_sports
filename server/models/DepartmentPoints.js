const mongoose = require('mongoose');

const DepartmentPointsSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      unique: true
    },
    tournamentsPlayed: {
      type: Number,
      default: 0
    },
    matchesPlayed: {
      type: Number,
      default: 0
    },
    matchesWon: {
      type: Number,
      default: 0
    },
    matchesLost: {
      type: Number,
      default: 0
    },
    matchesDrawn: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DepartmentPoints', DepartmentPointsSchema);
