// server/models/Room.js

const mongoose = require('mongoose');

const { ROOM_STATUS, ROOM_CODE_LENGTH, ROOM_CODE_CHARSET } = require('../constants/roomConstants');
const { PLAYER_ROLES, AUCTION_CATEGORIES } = require('../constants/auctionConstants');

const roomCodePattern = new RegExp(`^[${ROOM_CODE_CHARSET}]{${ROOM_CODE_LENGTH}}$`);

// One entry per player who has gone through the auction, regardless of outcome.
// This embedded array is the single source of truth for what's been sold,
// what's gone unsold, and therefore what's eligible for the unsold/mini-auction round.
const auctionLogEntrySchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(AUCTION_CATEGORIES),
      required: true,
    },
    // Only meaningful if Pool 1 / Pool 2 turn out to be auctioned role-block by
    // role-block rather than as one mixed queue — see note below. Left null
    // and unused if that's not how the engine ends up working.
    roleSubPhase: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      default: null,
    },
    result: {
      type: String,
      enum: ['sold', 'unsold'],
      required: true,
    },
    finalPriceLakhs: {
      type: Number,
      min: 0,
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [roomCodePattern, 'Invalid room code format.'],
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.LOBBY,
    },
    currentRoleSubPhase: {
      type: String,
      enum: Object.values(PLAYER_ROLES),
      default: null,
    },
    auctionLog: {
      type: [auctionLogEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;