// server/services/bidService.js

const { BID_INCREMENT_TIERS, MAX_SQUAD_SIZE } = require('../constants/auctionConstants');
const squadValidationService = require('./squadValidationService');

// Looks up the increment for the tier the current bid sits in. Relies on
// the lower-inclusive/upper-exclusive boundary convention already fixed in
// auctionConstants.js (e.g. exactly 2 Cr falls into the 50-Lakh tier).
const getIncrementForBid = (currentBidLakhs) => {
  const tier = BID_INCREMENT_TIERS.find(
    (candidate) => candidate.upToLakhs === null || currentBidLakhs < candidate.upToLakhs
  );
  return tier.incrementLakhs;
};

// currentBidLakhs is null until the first bid lands — the first legal bid
// on any player is simply its base price, not "base price plus an increment."
const calculateNextBidLakhs = (currentBidLakhs, basePriceLakhs) => {
  if (currentBidLakhs === null || currentBidLakhs === undefined) {
    return basePriceLakhs;
  }

  return currentBidLakhs + getIncrementForBid(currentBidLakhs);
};

// Validates that `team` may place the next legal bid on `player`. Throws a
// statusCode-tagged error (same convention as every other service) if not;
// otherwise returns the exact amount AuctionEngine.js should apply. This
// only checks affordability for *this bid* — it never deducts anything.
// Budget is only actually spent once a player is sold, not on every bid.
const validateBid = ({ team, player, currentBidLakhs, highestBidderTeamId }) => {
  if (highestBidderTeamId && team._id.toString() === highestBidderTeamId.toString()) {
    const error = new Error('You are already the highest bidder on this player.');
    error.statusCode = 409;
    throw error;
  }

  if (team.squad.length >= MAX_SQUAD_SIZE) {
    const error = new Error(`Your squad is already full (${MAX_SQUAD_SIZE} players).`);
    error.statusCode = 409;
    throw error;
  }

  const nextBidLakhs = calculateNextBidLakhs(currentBidLakhs, player.basePriceLakhs);

  if (team.budgetRemainingLakhs < nextBidLakhs) {
    const error = new Error('Insufficient budget to place this bid.');
    error.statusCode = 409;
    throw error;
  }

  const feasibility = squadValidationService.canTeamBid({ team, player, nextBidLakhs });

  if (!feasibility.canBid) {
    const error = new Error(feasibility.reason);
    error.statusCode = 409;
    throw error;
  }

  return nextBidLakhs;
};

module.exports = {
  calculateNextBidLakhs,
  validateBid,
};