// server/models/Player.js

const mongoose = require('mongoose');

const {
  PLAYER_ROLES,
  AUCTION_CATEGORIES,
  BASE_PRICE_LAKHS,
} = require('../constants/auctionConstants');

// Original categories a player can start in. Mini-Auction is deliberately
// excluded — it's never a player's home category, only a room-runtime pool
// assembled later from players who went unsold (see unsoldRoundManager.js,
// Phase 9). No Player document is ever created directly into it.
const ORIGINAL_PLAYER_CATEGORIES = [
  AUCTION_CATEGORIES.MARQUEE,
  AUCTION_CATEGORIES.POOL_1,
  AUCTION_CATEGORIES.POOL_2,
];

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required.'],
      trim: true,
      minlength: [2, 'Player name must be at least 2 characters long.'],
      maxlength: [60, 'Player name cannot exceed 60 characters.'],
    },
    role: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      required: [true, 'Player role is required.'],
    },
    category: {
      type: String,
      enum: ORIGINAL_PLAYER_CATEGORIES,
      required: [true, 'Player category is required.'],
    },
    basePriceLakhs: {
      type: Number,
      min: [0, 'Base price cannot be negative.'],
      // Left unset here on purpose — the pre-save hook below fills in the
      // category's standard rate if you don't provide one manually, while
      // still allowing an explicit override per player.
    },
    country: {
      type: String,
      trim: true,
      maxlength: [56, 'Country name cannot exceed 56 characters.'],
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Lets you add a player without typing a base price every time, while still
// allowing an explicit override (e.g. a marquee player entered above the
// standard 2 Cr rate) — only fills the gap, never overwrites a value you set.
playerSchema.pre('save', function applyDefaultBasePrice(next) {
  if (this.basePriceLakhs === undefined || this.basePriceLakhs === null) {
    this.basePriceLakhs = BASE_PRICE_LAKHS[this.category];
  }
  next();
});

// Supports playerQueueManager.js's per-role-block queries (Phase 7) — e.g.
// Player.find({ category: 'pool1', role: 'batter', isActive: true }), now
// that Pool 1 / Pool 2 are confirmed to run role-block by role-block.
playerSchema.index({ category: 1, role: 1, isActive: 1 });

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;