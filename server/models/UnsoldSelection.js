// server/models/UnsoldSelection.js

const mongoose = require('mongoose');

const unsoldSelectionSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    selectedPlayerIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Player',
        },
      ],
      default: [],
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One selection document per team per room — mirrors Team.js's own
// {roomId, userId} uniqueness guarantee, for the identical reason: a team
// updates its picks repeatedly during the 5-minute window, never creates a
// second competing record.
unsoldSelectionSchema.index({ roomId: 1, teamId: 1 }, { unique: true });

const UnsoldSelection = mongoose.model('UnsoldSelection', unsoldSelectionSchema);

module.exports = UnsoldSelection;