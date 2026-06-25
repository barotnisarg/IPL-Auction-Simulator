// server/services/auctionEngine/playerQueueManager.js

const { AUCTION_CATEGORIES, PLAYER_ROLES } = require('../../constants/auctionConstants');
const { getPlayersByCategory, getPlayersByCategoryAndRole } = require('../playerService');
const shuffleArray = require('../../utils/shuffleArray');

// Derived from PLAYER_ROLES's own declaration order, not hand-typed — that
// order already happens to match the confirmed Pool 1/Pool 2 sequence
// (Batter -> All-Rounder -> Bowler -> Wicketkeeper). If that ever needs to
// diverge from PLAYER_ROLES's natural order, this becomes an explicit array.
const ROLE_BLOCK_ORDER = Object.values(PLAYER_ROLES);

// ObjectIds must be compared as strings — two ObjectId instances representing
// the same id are still different objects, so a direct Set/includes check
// against raw ObjectIds would silently never match.
const excludeAlreadyAuctioned = (players, alreadyAuctionedPlayerIds) => {
  const excludedIds = new Set(alreadyAuctionedPlayerIds.map((id) => id.toString()));
  return players.filter((player) => !excludedIds.has(player._id.toString()));
};

// Marquee: one mixed-role shuffled queue, matching the original flow diagram
// (no role bullets were listed under "Marquee Category").
const buildMarqueeQueue = async (alreadyAuctionedPlayerIds = []) => {
  const players = await getPlayersByCategory(AUCTION_CATEGORIES.MARQUEE);
  const eligiblePlayers = excludeAlreadyAuctioned(players, alreadyAuctionedPlayerIds);
  return shuffleArray(eligiblePlayers);
};

// Pool 1 / Pool 2: an ordered array of role-blocks, each independently
// shuffled, in the confirmed sequence. A role-block with zero eligible
// players is omitted entirely — there's nothing for AuctionEngine.js to
// enter for a role with no remaining players.
const buildPoolRoleBlocks = async (category, alreadyAuctionedPlayerIds = []) => {
  const blocks = [];

  for (const role of ROLE_BLOCK_ORDER) {
    const players = await getPlayersByCategoryAndRole(category, role);
    const eligiblePlayers = excludeAlreadyAuctioned(players, alreadyAuctionedPlayerIds);

    if (eligiblePlayers.length > 0) {
      blocks.push({
        role,
        queue: shuffleArray(eligiblePlayers),
      });
    }
  }

  return blocks;
};

module.exports = {
  buildMarqueeQueue,
  buildPoolRoleBlocks,
};