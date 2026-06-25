// server/models/Team.js

const mongoose = require('mongoose');

const {
  STARTING_BUDGET_LAKHS,
  PLAYER_ROLES,
  AUCTION_CATEGORIES,
} = require('../constants/auctionConstants');

// A snapshot of a purchase, not a live reference to current Player data.
// role/category are denormalized at the moment of purchase so squad
// validation (bowling-option count, WK count) never needs to populate
// the global Player collection just to check a squad's composition.
const squadPlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(AUCTION_CATEGORIES),
      required: true,
    },
    purchasePriceLakhs: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamName: {
      type: String,
      required: [true, 'Team name is required.'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters long.'],
      maxlength: [40, 'Team name cannot exceed 40 characters.'],
    },
    budgetRemainingLakhs: {
      type: Number,
      default: STARTING_BUDGET_LAKHS,
      min: 0,
    },
    squad: {
      type: [squadPlayerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// A user can only hold one team per room.
teamSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;