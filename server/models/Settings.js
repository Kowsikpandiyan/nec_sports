const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      unique: true
    },
    collegeName: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#3b82f6' // Default tailwind blue-500
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    allowPublicRegistration: {
      type: Boolean,
      default: false
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', SettingsSchema);
