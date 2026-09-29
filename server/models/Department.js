const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    logo: {
      type: String,
      default: ''
    },
    coordinatorName: {
      type: String,
      required: [true, 'Coordinator name is required'],
      trim: true
    },
    coachName: {
      type: String,
      trim: true,
      default: ''
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: false
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure department name is unique per college
DepartmentSchema.index({ name: 1, college: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema);
