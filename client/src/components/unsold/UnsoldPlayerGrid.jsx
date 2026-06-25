// client/src/components/unsold/UnsoldPlayerGrid.jsx

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { UNSOLD_EVENTS } from '../../sockets/socketEvents';
import { togglePlayerSelection } from '../../features/unsold/unsoldSlice';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import Button from '../common/Button';

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

const snapshotOf = (ids) => [...ids].sort().join(',');

const UnsoldPlayerGrid = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { room } = useSelector((state) => state.room);
  const { unsoldPlayers, mySelectedPlayerIds, submissionStatus, submittedAt, isRoundActive } =
    useSelector((state) => state.unsold);

  // Tracks what was selected at the moment of the last successful
  // submission, purely locally — lets this component distinguish "fully
  // submitted, nothing's changed since" from "submitted earlier, but
  // you've changed your mind" without unsoldSlice.js itself needing to
  // track that distinction. See explanation.
  const lastSubmittedSnapshotRef = useRef(null);

  useEffect(() => {
    if (submittedAt) {
      lastSubmittedSnapshotRef.current = snapshotOf(mySelectedPlayerIds);
    }
    // Deliberately keyed on submittedAt alone — this should capture a
    // snapshot exactly once per confirmed submission, not on every
    // subsequent selection toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedAt]);

  const hasUnsubmittedChanges =
    submittedAt !== null && snapshotOf(mySelectedPlayerIds) !== lastSubmittedSnapshotRef.current;

  const handleToggle = (playerId) => {
    if (!isRoundActive) return;
    dispatch(togglePlayerSelection(playerId));
  };

  const handleSubmit = () => {
    if (!isRoundActive || !room) return;
    socket.emit(UNSOLD_EVENTS.SUBMIT_SELECTION, {
      roomCode: room.roomCode,
      selectedPlayerIds: mySelectedPlayerIds,
    });
  };

  const getSubmitLabel = () => {
    if (submissionStatus !== 'submitted') return 'Submit Selection';
    return hasUnsubmittedChanges ? 'Resubmit Selection' : 'Submitted';
  };

  if (unsoldPlayers.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
        <p className="text-sm text-neutral-500">No unsold players this round.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Unsold Players
        </h2>
        <span className="text-xs text-neutral-500">{mySelectedPlayerIds.length} selected</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {unsoldPlayers.map((player) => {
          const isSelected = mySelectedPlayerIds.includes(player._id);

          return (
            <button
              key={player._id}
              type="button"
              onClick={() => handleToggle(player._id)}
              disabled={!isRoundActive}
              className={`relative rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }`}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-neutral-950">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <p className="text-sm font-semibold text-neutral-100">{player.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ROLE_DISPLAY_LABELS[player.role]}
                {player.country ? ` · ${player.country}` : ''}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Base: {formatLakhsAsDisplay(player.basePriceLakhs)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-800 pt-4">
        <p className="text-xs text-neutral-500">
          {submissionStatus === 'submitted' && !hasUnsubmittedChanges
            ? 'Your picks are saved. You can keep changing them until time runs out.'
            : 'Your picks stay hidden from other teams until the round ends.'}
        </p>
        <Button onClick={handleSubmit} disabled={!isRoundActive}>
          {getSubmitLabel()}
        </Button>
      </div>
    </div>
  );
};

export default UnsoldPlayerGrid;