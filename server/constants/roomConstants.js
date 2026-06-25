// server/constants/roomConstants.js

const { AUCTION_CATEGORIES } = require('./auctionConstants');

const MIN_PLAYERS_PER_ROOM = 2;
const MAX_PLAYERS_PER_ROOM = 5;

// Every state a Room can be in across its full lifecycle.
// The four active-bidding states reuse AUCTION_CATEGORIES exactly,
// so the engine never has to translate between two different vocabularies.
const ROOM_STATUS = Object.freeze({
  LOBBY: 'lobby',
  MARQUEE: AUCTION_CATEGORIES.MARQUEE,
  POOL_1: AUCTION_CATEGORIES.POOL_1,
  POOL_2: AUCTION_CATEGORIES.POOL_2,
  UNSOLD_SELECTION: 'unsold-selection',
  MINI_AUCTION: AUCTION_CATEGORIES.MINI_AUCTION,
  COMPLETED: 'completed',
});

// The fixed order phases progress through, taken directly from the project flow:
// Lobby -> Marquee -> Pool 1 -> Pool 2 -> Unsold Selection -> Mini Auction -> Completed.
const ROOM_STATUS_FLOW = Object.freeze([
  ROOM_STATUS.LOBBY,
  ROOM_STATUS.MARQUEE,
  ROOM_STATUS.POOL_1,
  ROOM_STATUS.POOL_2,
  ROOM_STATUS.UNSOLD_SELECTION,
  ROOM_STATUS.MINI_AUCTION,
  ROOM_STATUS.COMPLETED,
]);

// Room codes use an unambiguous charset (no 0/O or 1/I) since teams type these by hand to join.
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

module.exports = {
  MIN_PLAYERS_PER_ROOM,
  MAX_PLAYERS_PER_ROOM,
  ROOM_STATUS,
  ROOM_STATUS_FLOW,
  ROOM_CODE_LENGTH,
  ROOM_CODE_CHARSET,
};