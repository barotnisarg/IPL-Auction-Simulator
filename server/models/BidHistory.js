// server/models/BidHistory.js

const mongoose = require('mongoose');

const { AUCTION_CATEGORIES, PLAYER_ROLES } = require('../constants/auctionConstants');

const bidHistorySchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    bidAmountLakhs: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: Object.values(AUCTION_CATEGORIES),
      required: true,
    },
    // Mirrors Room.js's auctionLog.roleSubPhase — null for marquee/mini-auction,
    // populated for pool1/pool2 now that role-block sequencing is confirmed.
    roleSubPhase: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      default: null,
    },
  },
  { timestamps: true }
);

// Supports the two real read patterns: "every bid on the player currently
// up" (HistoryPanel's live mode) and "every bid in this room" (the full
// auction-wide bid log, if ever needed). createdAt ordering is what makes
// either query return bids in the order they actually happened.
bidHistorySchema.index({ roomId: 1, playerId: 1, createdAt: 1 });

const BidHistory = mongoose.model('BidHistory', bidHistorySchema);

module.exports = BidHistory;