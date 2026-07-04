// client/src/components/auction/BidControls.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { AUCTION_EVENTS } from '../../sockets/socketEvents';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Button from '../common/Button';

const MAX_SQUAD_SIZE = 11;

const BID_INCREMENT_TIERS = [
  { upToLakhs: 100,  incrementLakhs: 10  },
  { upToLakhs: 200,  incrementLakhs: 25  },
  { upToLakhs: 500,  incrementLakhs: 50  },
  { upToLakhs: null, incrementLakhs: 100 },
];

const getIncrementForBid = (lakhs) => {
  const tier = BID_INCREMENT_TIERS.find(
    (t) => t.upToLakhs === null || lakhs < t.upToLakhs
  );
  return tier.incrementLakhs;
};

const calculateNextBidLakhs = (currentBidLakhs, basePriceLakhs) => {
  if (currentBidLakhs === null || currentBidLakhs === undefined) return basePriceLakhs;
  return currentBidLakhs + getIncrementForBid(currentBidLakhs);
};

const SUBMIT_LOCK_MS = 600;

const sameId = (a, b) => {
  if (!a || !b) return false;
  const s = (v) => (typeof v === 'object' ? String(v._id ?? v) : String(v));
  return s(a) === s(b);
};

// compact prop: true when rendered inside the mobile sticky bottom bar.
// In compact mode we strip the wrapper card since the bar itself provides
// the surface — avoids double borders / double padding on mobile.
const BidControls = ({ compact = false }) => {
  const { socket }  = useSocket();
  const { room }    = useSelector((state) => state.room);
  const { user }    = useSelector((state) => state.auth);
  const { teams }   = useSelector((state) => state.team);
  const {
    currentPlayer,
    currentBidLakhs,
    highestBidderTeamId,
    teamSummaries,
    skippedTeamIds,
    isPaused,
  } = useSelector((state) => state.auction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const myTeamRecord = teams.find((t) => sameId(t.userId, user?._id));
  const mySummary    = teamSummaries.find((s) => sameId(s.teamId, myTeamRecord?._id));

  const budgetRemainingLakhs =
    mySummary?.budgetRemainingLakhs ?? myTeamRecord?.budgetRemainingLakhs ?? 0;
  const squadSize = mySummary?.squadSize ?? myTeamRecord?.squad?.length ?? 0;

  if (!room || !currentPlayer || !myTeamRecord) return null;

  const myTeamId       = myTeamRecord._id?.toString();
  const isHighestBidder = sameId(highestBidderTeamId, myTeamRecord._id);
  const isSquadFull    = squadSize >= MAX_SQUAD_SIZE;
  const nextBidLakhs   = calculateNextBidLakhs(currentBidLakhs, currentPlayer.basePriceLakhs);
  const canAfford      = budgetRemainingLakhs >= nextBidLakhs;
  const iHaveSkipped   = skippedTeamIds.includes(myTeamId);
  const skipCount      = skippedTeamIds.length;

  const canBid  = !isPaused && !isHighestBidder && !isSquadFull && canAfford && !isSubmitting;
  const canSkip = !isPaused && !isHighestBidder && !iHaveSkipped && !isSubmitting;

  const emitAndLock = (event) => {
    setIsSubmitting(true);
    socket.emit(event, { roomCode: room.roomCode });
    setTimeout(() => setIsSubmitting(false), SUBMIT_LOCK_MS);
  };

  const disabledReason = (() => {
    if (isPaused)         return 'Auction is paused.';
    if (isHighestBidder)  return "You're the highest bidder.";
    if (isSquadFull)      return `Squad full (${MAX_SQUAD_SIZE} players).`;
    if (!canAfford)       return 'Insufficient budget.';
    return null;
  })();

  const inner = (
    <>
      {/* Next bid label — compact mode shows it inline with budget */}
      {compact ? (
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-500">
            Budget left:{' '}
            <span className="nums font-mono font-bold text-neutral-300">
              {formatLakhsAsDisplay(budgetRemainingLakhs)}
            </span>
          </span>
          <span className="font-medium text-neutral-500">
            Next bid:{' '}
            <span className="nums font-mono font-bold text-amber-400">
              {formatLakhsAsDisplay(nextBidLakhs)}
            </span>
          </span>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-500">Your next bid</p>
          <p className="nums font-mono text-lg font-black text-amber-400">
            {formatLakhsAsDisplay(nextBidLakhs)}
          </p>
        </div>
      )}

      {/* Bid + Skip buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => emitAndLock(AUCTION_EVENTS.PLACE_BID)}
          disabled={!canBid}
          size={compact ? 'md' : 'lg'}
          className="flex-1"
        >
          Bid {formatLakhsAsDisplay(nextBidLakhs)}
        </Button>

        <div className="relative">
          <Button
            variant={iHaveSkipped ? 'danger' : 'secondary'}
            onClick={() => emitAndLock(AUCTION_EVENTS.SKIP_BID)}
            disabled={!canSkip}
            size={compact ? 'md' : 'lg'}
          >
            {iHaveSkipped ? 'Skipped' : 'Skip'}
          </Button>

          {skipCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
              {skipCount}
            </span>
          )}
        </div>
      </div>

      {/* Reason + skip info */}
      {(disabledReason || skipCount > 0) && (
        <div className="mt-2 space-y-0.5 text-center">
          {disabledReason && (
            <p className="text-xs text-neutral-600">{disabledReason}</p>
          )}
          {skipCount > 0 && (
            <p className="text-xs text-red-500">
              {skipCount} {skipCount === 1 ? 'team has' : 'teams have'} skipped
            </p>
          )}
        </div>
      )}
    </>
  );

  // Compact mode: no wrapper card — the sticky bar in AuctionPage is the surface.
  if (compact) return <div>{inner}</div>;

  // Desktop: full card wrapper.
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      {inner}
    </div>
  );
};

export default BidControls;