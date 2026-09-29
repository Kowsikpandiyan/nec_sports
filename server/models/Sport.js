const mongoose = require('mongoose');

const SportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sport name is required'],
      unique: true,
      enum: [
        'Football',
        'Cricket',
        'Basketball',
        'Volleyball',
        'Badminton',
        'Kabaddi',
        'Chess',
        'TableTennis'
      ]
    },
    icon: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      trim: true
    },
    maxPlayersPerTeam: {
      type: Number,
      required: [true, 'Max players per team is required']
    },
    eventTypes: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Sport', SportSchema);
