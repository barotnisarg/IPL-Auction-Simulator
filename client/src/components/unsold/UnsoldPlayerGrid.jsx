// client/src/components/unsold/UnsoldPlayerGrid.jsx

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { UNSOLD_EVENTS } from '../../sockets/socketEvents';
import { togglePlayerSelection } from '../../features/unsold/unsoldSlice';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Button from '../common/Button';

const ROLE_LABELS = {
  batter:        'Batter',
  'all-rounder': 'All-Rounder',
  bowler:        'Bowler',
  wicketkeeper:  'Wicketkeeper',
};

const ROLE_SHORT = {
  batter:        'BAT',
  'all-rounder': 'AR',
  bowler:        'BOWL',
  wicketkeeper:  'WK',
};

const ROLE_COLOR = {
  batter:        'text-sky-400 bg-sky-400/10',
  'all-rounder': 'text-violet-400 bg-violet-400/10',
  bowler:        'text-emerald-400 bg-emerald-400/10',
  wicketkeeper:  'text-amber-400 bg-amber-400/10',
};

const CheckIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const snapshotOf = (ids) => [...ids].sort().join(',');

const UnsoldPlayerGrid = () => {
  const dispatch   = useDispatch();
  const { socket } = useSocket();
  const { room }   = useSelector((s) => s.room);
  const {
    unsoldPlayers,
    mySelectedPlayerIds,
    submissionStatus,
    submittedAt,
    isRoundActive,
  } = useSelector((s) => s.unsold);

  const lastSubmittedSnapshotRef = useRef(null);

  useEffect(() => {
    if (submittedAt) {
      lastSubmittedSnapshotRef.current = snapshotOf(mySelectedPlayerIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedAt]);

  const hasUnsubmittedChanges =
    submittedAt !== null &&
    snapshotOf(mySelectedPlayerIds) !== lastSubmittedSnapshotRef.current;

  const isSubmitted    = submissionStatus === 'submitted' && !hasUnsubmittedChanges;
  const selectedCount  = mySelectedPlayerIds.length;

  const handleToggle = (playerId) => {
    if (!isRoundActive) return;
    dispatch(togglePlayerSelection(playerId));
  };

  const handleSubmit = () => {
    if (!isRoundActive || !room) return;
    socket.emit(UNSOLD_EVENTS.SUBMIT_SELECTION, {
      roomCode:          room.roomCode,
      selectedPlayerIds: mySelectedPlayerIds,
    });
  };

  const submitLabel = submissionStatus !== 'submitted'
    ? 'Submit selection'
    : hasUnsubmittedChanges
    ? 'Resubmit'
    : 'Submitted ✓';

  if (unsoldPlayers.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
        <p className="text-sm text-neutral-600">No unsold players this round.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <h2 className="text-sm font-bold text-neutral-100">Unsold Players</h2>
        <span className={[
          'rounded-md px-2.5 py-0.5 font-mono text-xs font-bold transition-colors',
          selectedCount > 0
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-neutral-800 text-neutral-500',
        ].join(' ')}>
          {selectedCount} selected
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
        {unsoldPlayers.map((player) => {
          const isSelected = mySelectedPlayerIds.includes(player._id);

          return (
            <button
              key={player._id}
              type="button"
              onClick={() => handleToggle(player._id)}
              disabled={!isRoundActive}
              className={[
                'relative rounded-lg border p-3 text-left',
                'transition-all duration-150 active:scale-[0.97]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-900',
              ].join(' ')}
            >
              {/* Selected checkmark badge */}
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-neutral-950 shadow-sm">
                  <CheckIcon />
                </span>
              )}

              {/* Role pill */}
              <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${ROLE_COLOR[player.role] ?? 'text-neutral-400 bg-neutral-800'}`}>
                {ROLE_SHORT[player.role] ?? player.role}
              </span>

              {/* Player info */}
              <p className="mt-1.5 text-sm font-bold leading-tight text-neutral-100 pr-5">
                {player.name}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ROLE_LABELS[player.role]}
                {player.country ? ` · ${player.country}` : ''}
              </p>
              <p className="nums mt-1 font-mono text-xs font-semibold text-neutral-600">
                {formatLakhsAsDisplay(player.basePriceLakhs)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer — submit area */}
      <div className="border-t border-neutral-800 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-neutral-600">
            {isSubmitted
              ? 'Your picks are locked in. You can still change them before time runs out.'
              : 'Your picks stay hidden from other teams until the round ends.'}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!isRoundActive}
            variant={isSubmitted ? 'secondary' : 'primary'}
            size="md"
            className="shrink-0"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnsoldPlayerGrid;