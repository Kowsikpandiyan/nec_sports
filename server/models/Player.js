const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    photo: {
      type: String,
      default: ''
    },
    age: {
      type: Number,
      required: [true, 'Age is required']
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    position: {
      type: String,
      trim: true
    },
    jerseyNumber: {
      type: Number,
      required: [true, 'Jersey number is required']
    },
    sports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sport'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure rollNumber is unique per department
PlayerSchema.index({ rollNumber: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Player', PlayerSchema);
