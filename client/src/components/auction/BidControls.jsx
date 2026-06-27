// client/src/components/auction/BidControls.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { AUCTION_EVENTS } from '../../sockets/socketEvents';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Button from '../common/Button';

const MAX_SQUAD_SIZE = 11;
const BID_INCREMENT_TIERS = [
  { upToLakhs: 100, incrementLakhs: 10 },
  { upToLakhs: 200, incrementLakhs: 25 },
  { upToLakhs: 500, incrementLakhs: 50 },
  { upToLakhs: null, incrementLakhs: 100 },
];

const getIncrementForBid = (currentBidLakhs) => {
  const tier = BID_INCREMENT_TIERS.find(
    (candidate) => candidate.upToLakhs === null || currentBidLakhs < candidate.upToLakhs
  );
  return tier.incrementLakhs;
};

const calculateNextBidLakhs = (currentBidLakhs, basePriceLakhs) => {
  if (currentBidLakhs === null || currentBidLakhs === undefined) {
    return basePriceLakhs;
  }
  return currentBidLakhs + getIncrementForBid(currentBidLakhs);
};

const SUBMIT_LOCK_MS = 600;

const sameId = (a, b) => {
  if (!a || !b) return false;
  const strA = typeof a === 'object' ? String(a._id ?? a) : String(a);
  const strB = typeof b === 'object' ? String(b._id ?? b) : String(b);
  return strA === strB;
};

const BidControls = () => {
  const { socket } = useSocket();
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  const {
    currentPlayer,
    currentBidLakhs,
    highestBidderTeamId,
    teamSummaries,
    skippedTeamIds,
    isPaused,
  } = useSelector((state) => state.auction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const myTeamRecord = teams.find((team) => sameId(team.userId, user?._id));
  const mySummary = teamSummaries.find((summary) => sameId(summary.teamId, myTeamRecord?._id));

  const budgetRemainingLakhs =
    mySummary?.budgetRemainingLakhs ?? myTeamRecord?.budgetRemainingLakhs ?? 0;
  const squadSize = mySummary?.squadSize ?? myTeamRecord?.squad?.length ?? 0;

  if (!room || !currentPlayer || !myTeamRecord) {
    return null;
  }

  const myTeamId = myTeamRecord._id?.toString();
  const isHighestBidder = sameId(highestBidderTeamId, myTeamRecord._id);
  const isSquadFull = squadSize >= MAX_SQUAD_SIZE;
  const nextBidLakhs = calculateNextBidLakhs(currentBidLakhs, currentPlayer.basePriceLakhs);
  const canAfford = budgetRemainingLakhs >= nextBidLakhs;

  // Has this user's team already skipped the current player?
  const iHaveSkipped = skippedTeamIds.includes(myTeamId);
  // Total teams that skipped — shown as badge on the button.
  const skipCount = skippedTeamIds.length;

  const canBid = !isPaused && !isHighestBidder && !isSquadFull && canAfford && !isSubmitting;
  // Once skipped you can't un-skip; highest bidder can't skip either.
  const canSkip = !isPaused && !isHighestBidder && !iHaveSkipped && !isSubmitting;

  const emitAndLock = (eventName) => {
    setIsSubmitting(true);
    socket.emit(eventName, { roomCode: room.roomCode });
    setTimeout(() => setIsSubmitting(false), SUBMIT_LOCK_MS);
  };

  const getDisabledReason = () => {
    if (isPaused) return 'Auction is paused.';
    if (isHighestBidder) return "You're already the highest bidder.";
    if (isSquadFull) return `Your squad is full (${MAX_SQUAD_SIZE} players).`;
    if (!canAfford) return 'Insufficient budget for this bid.';
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-neutral-500">Next bid</p>
        <p className="text-lg font-bold text-amber-400">{formatLakhsAsDisplay(nextBidLakhs)}</p>
      </div>

      <div className="mt-4 flex gap-3">
        {/* Bid button */}
        <Button
          onClick={() => emitAndLock(AUCTION_EVENTS.PLACE_BID)}
          disabled={!canBid}
          size="lg"
          className="flex-1"
        >
          Bid {formatLakhsAsDisplay(nextBidLakhs)}
        </Button>

        {/* Skip button — turns red + says "Skipped" once this team skips.
            Badge on top-right shows how many teams total have skipped. */}
        <div className="relative">
          <Button
            variant={iHaveSkipped ? 'danger' : 'secondary'}
            onClick={() => emitAndLock(AUCTION_EVENTS.SKIP_BID)}
            disabled={!canSkip}
            size="lg"
          >
            {iHaveSkipped ? 'Skipped' : 'Skip'}
          </Button>

          {skipCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md">
              {skipCount}
            </span>
          )}
        </div>
      </div>

      {disabledReason && (
        <p className="mt-3 text-center text-xs text-neutral-500">{disabledReason}</p>
      )}

      {/* Skip context — visible to everyone once any team skips */}
      {skipCount > 0 && (
        <p className="mt-2 text-center text-xs text-red-400">
          {skipCount} {skipCount === 1 ? 'team has' : 'teams have'} skipped this player
        </p>
      )}
    </div>
  );
};

export default BidControls;