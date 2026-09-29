const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // null indicates a public broadcast notification
      default: null
    },
    type: {
      type: String,
      enum: ['matchScheduled', 'matchLive', 'matchFinished', 'winnerAnnounced', 'teamApproved'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: false,
      default: null
    },
    relatedTournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: false,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);
