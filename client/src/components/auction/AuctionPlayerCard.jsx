// client/src/components/auction/AuctionPlayerCard.jsx

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Countdown from '../common/Countdown';

// Mirrored from server/constants/auctionConstants.js
const BID_TIMER_SECONDS = 7;

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

const CATEGORY_DISPLAY_LABELS = {
  marquee: 'Marquee',
  pool1: 'Pool 1',
  pool2: 'Pool 2',
  'mini-auction': 'Mini-Auction',
};

// How long the outcome overlay stays visible.
// The next player's STATE_UPDATE arrives almost immediately after PLAYER_SOLD/
// PLAYER_UNSOLD, so the card behind the overlay would already be showing the
// new player and counting down. We freeze the card content AND pause the
// visible timer for this duration so users get a full uninterrupted countdown
// on every player.
const OUTCOME_DISPLAY_MS = 2500;

const PlayerSilhouette = () => (
  <svg
    className="h-16 w-16 text-neutral-600"
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

  // visibleOutcome: the overlay content (what's shown on top)
  const [visibleOutcome, setVisibleOutcome] = useState(null);

  // frozenCard: a snapshot of the card's own content captured at the moment
  // the outcome fires. While the overlay is up, we render this frozen snapshot
  // instead of the live Redux state so:
  //   (a) The card behind the overlay doesn't flicker to the next player, and
  //   (b) The countdown doesn't secretly start draining for the next player
  //       while users are still reading "SOLD!" or "UNSOLD".
  const [frozenCard, setFrozenCard] = useState(null);

  // Keep a stable ref to the current live values so the timeout cleanup
  // callback can snap back to them without stale closures.
  const liveRef = useRef({});
  liveRef.current = { currentPlayer, currentBidLakhs, highestBidderTeamId, secondsRemaining, isPaused };

  useEffect(() => {
    if (!lastResolvedPlayer) {
      return undefined;
    }

    // Capture the card snapshot exactly as it looked when the outcome fired.
    setFrozenCard({
      player: liveRef.current.currentPlayer,
      currentBidLakhs: liveRef.current.currentBidLakhs,
      highestBidderTeamId: liveRef.current.highestBidderTeamId,
      secondsRemaining: liveRef.current.secondsRemaining,
    });
    setVisibleOutcome(lastResolvedPlayer);

    const timeoutId = setTimeout(() => {
      setVisibleOutcome(null);
      setFrozenCard(null); // unfreeze — card snaps to live Redux state
    }, OUTCOME_DISPLAY_MS);

    return () => clearTimeout(timeoutId);
  }, [lastResolvedPlayer]);

  // While the overlay is showing, render the frozen snapshot.
  // Once it clears, fall back to live Redux state.
  const displayPlayer   = frozenCard ? frozenCard.player            : currentPlayer;
  const displayBidLakhs = frozenCard ? frozenCard.currentBidLakhs   : currentBidLakhs;
  const displayBidderId = frozenCard ? frozenCard.highestBidderTeamId : highestBidderTeamId;
  // Timer is frozen at its last value while the overlay is visible.
  const displaySeconds  = frozenCard ? frozenCard.secondsRemaining   : secondsRemaining;
  const timerPaused     = isPaused || Boolean(frozenCard);

  const highestBidderName = displayBidderId
    ? teamSummaries.find((t) => t.teamId === displayBidderId)?.teamName
    : null;

  const categoryLabel = room ? CATEGORY_DISPLAY_LABELS[room.status] : null;
  const roleSubPhaseLabel = room?.currentRoleSubPhase
    ? ROLE_DISPLAY_LABELS[room.currentRoleSubPhase]
    : null;

  const showTimer = displayPlayer && !timerPaused && displaySeconds !== null;

  if (!displayPlayer) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-sm text-neutral-500">Waiting for the next player...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>

        <div className="flex items-center gap-4">
          {categoryLabel && (
            <span className="text-xs uppercase tracking-wider text-neutral-500">
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

          {timerPaused && !frozenCard && displayPlayer && (
            <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Paused
            </span>
          )}
        </div>
      </div>

      {/* Player info */}
      <div className="mt-6 flex items-center gap-5">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-800">
          {displayPlayer.imageUrl ? (
            <img
              src={displayPlayer.imageUrl}
              alt={displayPlayer.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <PlayerSilhouette />
          )}
        </div>

        <div>
          <p className="text-xl font-bold text-neutral-100">{displayPlayer.name}</p>
          <p className="text-sm text-neutral-400">
            {ROLE_DISPLAY_LABELS[displayPlayer.role]}
            {displayPlayer.country ? ` · ${displayPlayer.country}` : ''}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
            Base price: {formatLakhsAsDisplay(displayPlayer.basePriceLakhs)}
          </p>
        </div>
      </div>

      {/* Bid row */}
      <div className="mt-6 flex items-end justify-between border-t border-neutral-800 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Current bid</p>
          <p className="text-3xl font-black text-amber-400">
            {formatLakhsAsDisplay(displayBidLakhs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Highest bidder</p>
          <p className="text-sm font-semibold text-neutral-200">
            {highestBidderName || 'No bids yet'}
          </p>
        </div>
      </div>

      {/* Outcome overlay */}
      {visibleOutcome && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-950/95">
          {visibleOutcome.type === 'sold' ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">
                🔨 Sold
              </p>
              <p className="mt-1 text-2xl font-black text-neutral-100">
                {visibleOutcome.player.name}
              </p>
              <p className="text-3xl font-black text-amber-400">
                {formatLakhsAsDisplay(visibleOutcome.priceLakhs)}
              </p>
              <p className="text-xs uppercase tracking-widest text-neutral-500">to</p>
              <p className="text-3xl font-black text-emerald-400">
                {visibleOutcome.team.teamName}
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-black text-neutral-500">UNSOLD</p>
              <p className="mt-2 text-lg font-semibold text-neutral-400">
                {visibleOutcome.player.name}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuctionPlayerCard;