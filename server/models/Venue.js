const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    capacity: {
      type: Number,
      default: 0
    },
    amenities: [
      {
        type: String,
        trim: true
      }
    ],
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure venue name is unique per college
VenueSchema.index({ name: 1, college: 1 }, { unique: true });

module.exports = mongoose.model('Venue', VenueSchema);
