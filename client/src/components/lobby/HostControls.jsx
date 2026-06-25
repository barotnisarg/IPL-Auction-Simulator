// client/src/components/lobby/HostControls.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { AUCTION_EVENTS } from '../../sockets/socketEvents';
import Button from '../common/Button';
import Modal from '../common/Modal';

// Mirrored from server/constants/roomConstants.js — no shared package across
// the client/server boundary, kept in sync by hand.
const ROOM_STATUS_LOBBY = 'lobby';
const ROOM_STATUS_COMPLETED = 'completed';
const MIN_PLAYERS_PER_ROOM = 2;

const HostControls = () => {
  const { socket } = useSocket();
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  // Fixed here as the contract auctionSlice.js (Phase 7) will satisfy:
  // a single boolean for whether the live engine is currently paused.
  const isPaused = useSelector((state) => state.auction?.isPaused ?? false);

  const [confirmAction, setConfirmAction] = useState(null); // null | 'restart' | 'end'

  const isHost = Boolean(room) && Boolean(user) && room.hostUserId === user._id;

  if (!isHost || !room || room.status === ROOM_STATUS_COMPLETED) {
    return null;
  }

  const emit = (eventName) => {
    socket.emit(eventName, { roomCode: room.roomCode });
  };

  if (room.status === ROOM_STATUS_LOBBY) {
    const canStart = teams.length >= MIN_PLAYERS_PER_ROOM;

    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Host Controls
        </h2>

        <p className="mt-3 text-sm text-neutral-400">
          {canStart
            ? `${teams.length} franchises ready. You can start the auction whenever you like.`
            : `Waiting for at least ${MIN_PLAYERS_PER_ROOM} franchises to join (${teams.length}/${MIN_PLAYERS_PER_ROOM}).`}
        </p>

        <Button
          onClick={() => emit(AUCTION_EVENTS.START)}
          disabled={!canStart}
          size="lg"
          className="mt-4 w-full"
        >
          Start Auction
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Host Controls
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {isPaused ? (
            <Button size="sm" onClick={() => emit(AUCTION_EVENTS.RESUME)}>
              Resume
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => emit(AUCTION_EVENTS.PAUSE)}>
              Pause
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={() => setConfirmAction('restart')}>
            Restart
          </Button>

          <Button size="sm" variant="danger" onClick={() => setConfirmAction('end')}>
            End Auction
          </Button>
        </div>
      </div>

      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'restart' ? 'Restart the auction?' : 'End the auction?'}
        size="sm"
      >
        <p className="text-sm text-neutral-400">
          {confirmAction === 'restart'
            ? 'This resets every sale and every budget back to the start. This cannot be undone.'
            : 'This ends the auction immediately and locks in the current results. This cannot be undone.'}
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setConfirmAction(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              emit(confirmAction === 'restart' ? AUCTION_EVENTS.RESTART : AUCTION_EVENTS.END);
              setConfirmAction(null);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default HostControls;