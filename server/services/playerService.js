// server/services/playerService.js

const Player = require('../models/Player');

// Marquee's single mixed-role queue, and a building block for Pool 1/Pool 2
// if a future need ever wants "every role in this pool" without splitting
// by role block.
const getPlayersByCategory = async (category) => {
  const players = await Player.find({ category, isActive: true });
  return players;
};

// Pool 1 / Pool 2's per-role-block queue, now that sequential role blocks
// are confirmed (Batter -> All-Rounder -> Bowler -> Wicketkeeper).
const getPlayersByCategoryAndRole = async (category, role) => {
  const players = await Player.find({ category, role, isActive: true });
  return players;
};

// Used by unsoldRoundManager.js to fetch full player documents for the
// merged, de-duplicated set of unsold player ids that becomes the
// Mini-Auction pool.
const getPlayersByIds = async (playerIds) => {
  const players = await Player.find({
    _id: { $in: playerIds },
    isActive: true,
  });
  return players;
};

module.exports = {
  getPlayersByCategory,
  getPlayersByCategoryAndRole,
  getPlayersByIds,
};