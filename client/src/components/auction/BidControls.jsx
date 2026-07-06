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

const getIncrementForBid = (lakhs) =>
  BID_INCREMENT_TIERS.find((t) => t.upToLakhs === null || lakhs < t.upToLakhs).incrementLakhs;

const calculateNextBidLakhs = (currentBidLakhs, basePriceLakhs) =>
  currentBidLakhs === null || currentBidLakhs === undefined
    ? basePriceLakhs
    : currentBidLakhs + getIncrementForBid(currentBidLakhs);

const SUBMIT_LOCK_MS = 600;

const sameId = (a, b) => {
  if (!a || !b) return false;
  const s = (v) => (typeof v === 'object' ? String(v._id ?? v) : String(v));
  return s(a) === s(b);
};

const BidControls = ({ compact = false }) => {
  const { socket } = useSocket();
  const { room }   = useSelector((s) => s.room);
  const { user }   = useSelector((s) => s.auth);
  const { teams }  = useSelector((s) => s.team);
  const {
    currentPlayer,
    currentBidLakhs,
    highestBidderTeamId,
    teamSummaries,
    skippedTeamIds,
    isPaused,
  } = useSelector((s) => s.auction);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Brief visual press state — gives tactile feedback on the bid button
  // beyond just the active: scale, so users know the tap registered.
  const [justBid, setJustBid] = useState(false);

  const myTeamRecord = teams.find((t) => sameId(t.userId, user?._id));
  const mySummary    = teamSummaries.find((s) => sameId(s.teamId, myTeamRecord?._id));

  const budgetRemainingLakhs =
    mySummary?.budgetRemainingLakhs ?? myTeamRecord?.budgetRemainingLakhs ?? 0;
  const squadSize = mySummary?.squadSize ?? myTeamRecord?.squad?.length ?? 0;

  if (!room || !currentPlayer || !myTeamRecord) return null;

  const myTeamId        = myTeamRecord._id?.toString();
  const isHighestBidder = sameId(highestBidderTeamId, myTeamRecord._id);
  const isSquadFull     = squadSize >= MAX_SQUAD_SIZE;
  const nextBidLakhs    = calculateNextBidLakhs(currentBidLakhs, currentPlayer.basePriceLakhs);
  const canAfford       = budgetRemainingLakhs >= nextBidLakhs;
  const iHaveSkipped    = skippedTeamIds.includes(myTeamId);
  const skipCount       = skippedTeamIds.length;

  const canBid  = !isPaused && !isHighestBidder && !isSquadFull && canAfford && !isSubmitting;
  const canSkip = !isPaused && !isHighestBidder && !iHaveSkipped && !isSubmitting;

  const emitAndLock = (event) => {
    if (event === AUCTION_EVENTS.PLACE_BID) {
      setJustBid(true);
      setTimeout(() => setJustBid(false), 600);
    }
    setIsSubmitting(true);
    socket.emit(event, { roomCode: room.roomCode });
    setTimeout(() => setIsSubmitting(false), SUBMIT_LOCK_MS);
  };

  const disabledReason = (() => {
    if (isPaused)        return 'Auction is paused.';
    if (isHighestBidder) return "You're the highest bidder.";
    if (isSquadFull)     return `Squad full (${MAX_SQUAD_SIZE} players).`;
    if (!canAfford)      return 'Insufficient budget.';
    return null;
  })();

  const inner = (
    <>
      {compact ? (
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-500">
            Budget:{' '}
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

      <div className="flex gap-2">
        {/* Bid button — scale pulse confirms the tap registered */}
        <Button
          onClick={() => emitAndLock(AUCTION_EVENTS.PLACE_BID)}
          disabled={!canBid}
          size={compact ? 'md' : 'lg'}
          className={[
            'flex-1 transition-transform',
            justBid ? 'scale-95' : 'scale-100',
          ].join(' ')}
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

      {(disabledReason || skipCount > 0) && (
        <div className="mt-2 space-y-0.5 text-center">
          {disabledReason && <p className="text-xs text-neutral-600">{disabledReason}</p>}
          {skipCount > 0 && (
            <p className="text-xs text-red-500">
              {skipCount} {skipCount === 1 ? 'team has' : 'teams have'} skipped
            </p>
          )}
        </div>
      )}
    </>
  );

  if (compact) return <div>{inner}</div>;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      {inner}
    </div>
  );
};

export default BidControls;