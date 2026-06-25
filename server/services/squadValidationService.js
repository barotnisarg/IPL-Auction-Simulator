// server/services/squadValidationService.js

const {
  MAX_SQUAD_SIZE,
  MIN_BOWLING_OPTIONS,
  MIN_WICKETKEEPERS,
  BOWLING_OPTION_ROLES,
  PLAYER_ROLES,
  BASE_PRICE_LAKHS,
} = require('../constants/auctionConstants');

// The absolute floor any future player could ever cost, regardless of which
// category they're currently in — since any player who goes unsold
// eventually resurfaces in the Mini-Auction at its base price, which is the
// lowest of the four. Derived from the price table itself, not hand-typed,
// so this stays correct automatically if the table's values ever change.
const CHEAPEST_POSSIBLE_PRICE_LAKHS = Math.min(...Object.values(BASE_PRICE_LAKHS));

// Validates that, AFTER this specific purchase, the team still has a
// mathematically possible path to eventually reach both minimums —
// MIN_BOWLING_OPTIONS bowling-option players and MIN_WICKETKEEPERS
// wicketkeepers — using the most optimistic possible assumption about future
// prices. This is a feasibility gate, not a guarantee: it only stops a team
// from making it IMPOSSIBLE to comply, never forces them to actually comply.
const canTeamBid = ({ team, player, nextBidLakhs }) => {
  const currentBowlingCount = team.squad.filter((entry) =>
    BOWLING_OPTION_ROLES.includes(entry.role)
  ).length;
  const currentWicketkeeperCount = team.squad.filter(
    (entry) => entry.role === PLAYER_ROLES.WICKETKEEPER
  ).length;

  const isBowlingOption = BOWLING_OPTION_ROLES.includes(player.role);
  const isWicketkeeper = player.role === PLAYER_ROLES.WICKETKEEPER;

  const newSquadSize = team.squad.length + 1;
  const newBudgetRemainingLakhs = team.budgetRemainingLakhs - nextBidLakhs;
  const newBowlingCount = currentBowlingCount + (isBowlingOption ? 1 : 0);
  const newWicketkeeperCount = currentWicketkeeperCount + (isWicketkeeper ? 1 : 0);

  // bidService.js already rejects a squad-full team before this function is
  // ever called, so newSquadSize <= MAX_SQUAD_SIZE is already guaranteed —
  // remainingSlotsAfter can never go negative here.
  const remainingSlotsAfter = MAX_SQUAD_SIZE - newSquadSize;

  const stillNeededBowling = Math.max(0, MIN_BOWLING_OPTIONS - newBowlingCount);
  const stillNeededWicketkeepers = Math.max(0, MIN_WICKETKEEPERS - newWicketkeeperCount);
  const stillNeededMandatory = stillNeededBowling + stillNeededWicketkeepers;

  if (remainingSlotsAfter < stillNeededMandatory) {
    return {
      canBid: false,
      reason: `This bid would leave only ${remainingSlotsAfter} squad slot(s) remaining, but you'd still need ${stillNeededMandatory} more player(s) to meet your minimum role requirements.`,
    };
  }

  const requiredBudgetLakhs = stillNeededMandatory * CHEAPEST_POSSIBLE_PRICE_LAKHS;

  if (newBudgetRemainingLakhs < requiredBudgetLakhs) {
    return {
      canBid: false,
      reason: `This bid wouldn't leave enough budget to acquire the ${stillNeededMandatory} more player(s) needed to meet your minimum role requirements, even at the lowest possible price.`,
    };
  }

  return { canBid: true };
};

module.exports = { canTeamBid };