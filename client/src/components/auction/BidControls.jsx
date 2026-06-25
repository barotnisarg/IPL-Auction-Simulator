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

const BidControls = () => {
  const { socket } = useSocket();
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  const { currentPlayer, currentBidLakhs, highestBidderTeamId, teamSummaries, isPaused } =
    useSelector((state) => state.auction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const myTeamRecord = teams.find((team) => team.userId._id === user?._id);
  const mySummary = teamSummaries.find((summary) => summary.teamId === myTeamRecord?._id);

  const budgetRemainingLakhs =
    mySummary?.budgetRemainingLakhs ?? myTeamRecord?.budgetRemainingLakhs ?? 0;
  const squadSize = mySummary?.squadSize ?? myTeamRecord?.squad?.length ?? 0;

  if (!room || !currentPlayer || !myTeamRecord) {
    return null;
  }

  const isHighestBidder = highestBidderTeamId === myTeamRecord._id;
  const isSquadFull = squadSize >= MAX_SQUAD_SIZE;
  const nextBidLakhs = calculateNextBidLakhs(currentBidLakhs, currentPlayer.basePriceLakhs);
  const canAfford = budgetRemainingLakhs >= nextBidLakhs;

  const canBid = !isPaused && !isHighestBidder && !isSquadFull && canAfford && !isSubmitting;
  const canSkip = !isPaused && !isHighestBidder && !isSubmitting;

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
        <Button
          onClick={() => emitAndLock(AUCTION_EVENTS.PLACE_BID)}
          disabled={!canBid}
          size="lg"
          className="flex-1"
        >
          Bid {formatLakhsAsDisplay(nextBidLakhs)}
        </Button>
        <Button
          variant="secondary"
          onClick={() => emitAndLock(AUCTION_EVENTS.SKIP_BID)}
          disabled={!canSkip}
          size="lg"
        >
          Skip
        </Button>
      </div>

      {disabledReason && (
        <p className="mt-3 text-center text-xs text-neutral-500">{disabledReason}</p>
      )}
    </div>
  );
};

export default BidControls;