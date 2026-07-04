// client/src/components/auction/AuctionPlayerCard.jsx

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Countdown from '../common/Countdown';
import BidControls from './BidControls';

const BID_TIMER_SECONDS = 7;

const ROLE_DISPLAY_LABELS = {
  batter:       'Batter',
  'all-rounder': 'All-Rounder',
  bowler:        'Bowler',
  wicketkeeper:  'Wicketkeeper',
};

const CATEGORY_DISPLAY_LABELS = {
  marquee:        'Marquee',
  pool1:          'Pool 1',
  pool2:          'Pool 2',
  'mini-auction': 'Mini-Auction',
};

const OUTCOME_DISPLAY_MS = 2500;

const PlayerSilhouette = () => (
  <svg
    className="h-12 w-12 text-neutral-700"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

// The SOLD/UNSOLD stamp — the one moment that gets the stamp-in animation.
// Intentionally dramatic: rotated, large type, high contrast.
const OutcomeStamp = ({ outcome }) => {
  if (outcome.type === 'sold') {
    return (
      <div className="flex flex-col items-center gap-1 animate-stamp-in">
        {/* Stamp border mimics a real rubber stamp */}
        <div className="rounded-lg border-4 border-amber-400 px-6 py-3 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
          <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-amber-400">
            Sold
          </p>
          <p className="mt-0.5 text-2xl font-black leading-tight text-neutral-100">
            {outcome.player.name}
          </p>
          <p className="nums mt-1 font-mono text-3xl font-black text-amber-400">
            {formatLakhsAsDisplay(outcome.priceLakhs)}
          </p>
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">to</p>
        <p className="text-2xl font-black text-emerald-400">{outcome.team.teamName}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 animate-stamp-in">
      <div className="rounded-lg border-4 border-neutral-600 px-6 py-3 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
        <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-neutral-500">
          Unsold
        </p>
        <p className="mt-0.5 text-2xl font-black leading-tight text-neutral-400">
          {outcome.player.name}
        </p>
      </div>
    </div>
  );
};

const AuctionPlayerCard = () => {
  const {
    currentPlayer,
    currentBidLakhs,
    highestBidderTeamId,
    teamSummaries,
    lastResolvedPlayer,
    secondsRemaining,
    isPaused,
  } = useSelector((state) => state.auction);
  const { room } = useSelector((state) => state.room);

  const [visibleOutcome, setVisibleOutcome] = useState(null);
  const [frozenCard, setFrozenCard]         = useState(null);

  const liveRef = useRef({});
  liveRef.current = { currentPlayer, currentBidLakhs, highestBidderTeamId, secondsRemaining, isPaused };

  useEffect(() => {
    if (!lastResolvedPlayer) return undefined;

    setFrozenCard({
      player:              liveRef.current.currentPlayer,
      currentBidLakhs:     liveRef.current.currentBidLakhs,
      highestBidderTeamId: liveRef.current.highestBidderTeamId,
      secondsRemaining:    liveRef.current.secondsRemaining,
    });
    setVisibleOutcome(lastResolvedPlayer);

    const id = setTimeout(() => {
      setVisibleOutcome(null);
      setFrozenCard(null);
    }, OUTCOME_DISPLAY_MS);

    return () => clearTimeout(id);
  }, [lastResolvedPlayer]);

  const displayPlayer   = frozenCard ? frozenCard.player            : currentPlayer;
  const displayBidLakhs = frozenCard ? frozenCard.currentBidLakhs   : currentBidLakhs;
  const displayBidderId = frozenCard ? frozenCard.highestBidderTeamId : highestBidderTeamId;
  const displaySeconds  = frozenCard ? frozenCard.secondsRemaining   : secondsRemaining;
  const timerPaused     = isPaused || Boolean(frozenCard);

  const highestBidderName = displayBidderId
    ? teamSummaries.find((t) => t.teamId === displayBidderId)?.teamName
    : null;

  const categoryLabel     = room ? CATEGORY_DISPLAY_LABELS[room.status] : null;
  const roleSubPhaseLabel = room?.currentRoleSubPhase
    ? ROLE_DISPLAY_LABELS[room.currentRoleSubPhase]
    : null;

  const showTimer = displayPlayer && !timerPaused && displaySeconds !== null;

  // Empty state
  if (!displayPlayer) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
            <svg className="h-5 w-5 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M12 8v4M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-500">
            Waiting for the next player...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      {/* Thin top accent — only when live */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>

          <div className="flex items-center gap-3">
            {categoryLabel && (
              <span className="text-xs font-medium text-neutral-500">
                {categoryLabel}
                {roleSubPhaseLabel ? ` · ${roleSubPhaseLabel}` : ''}
              </span>
            )}

            {showTimer && (
              <Countdown
                totalSeconds={BID_TIMER_SECONDS}
                secondsRemaining={displaySeconds}
                isActive={!timerPaused}
                variant="ring"
                size="sm"
              />
            )}

            {timerPaused && !frozenCard && (
              <span className="rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-400">
                Paused
              </span>
            )}
          </div>
        </div>

        {/* ── Player info ── */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
            {displayPlayer.imageUrl ? (
              <img
                src={displayPlayer.imageUrl}
                alt={displayPlayer.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <PlayerSilhouette />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xl font-black text-neutral-100">
              {displayPlayer.name}
            </p>
            <p className="mt-0.5 text-sm text-neutral-400">
              {ROLE_DISPLAY_LABELS[displayPlayer.role]}
              {displayPlayer.country ? ` · ${displayPlayer.country}` : ''}
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-600">
              Base {formatLakhsAsDisplay(displayPlayer.basePriceLakhs)}
            </p>
          </div>
        </div>

        {/* ── Bid row ── */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-800 pt-4">
          <div>
            <p className="text-xs font-medium text-neutral-500">Current bid</p>
            <p className="nums mt-0.5 font-mono text-3xl font-black text-amber-400">
              {formatLakhsAsDisplay(displayBidLakhs)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-neutral-500">Highest bidder</p>
            <p className="mt-0.5 truncate text-sm font-bold text-neutral-200">
              {highestBidderName || 'No bids yet'}
            </p>
          </div>
        </div>

        {/* ── Inline BidControls — desktop only.
            On mobile BidControls lives in a sticky bottom bar in AuctionPage. ── */}
        <div className="mt-4 hidden md:block">
          <BidControls />
        </div>
      </div>

      {/* ── Outcome overlay ── */}
      {visibleOutcome && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/95">
          <OutcomeStamp outcome={visibleOutcome} />
        </div>
      )}
    </div>
  );
};

export default AuctionPlayerCard;