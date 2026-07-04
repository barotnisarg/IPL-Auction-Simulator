// client/src/components/lobby/HostControls.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

import useSocket from '../../hooks/useSocket';
import { AUCTION_EVENTS } from '../../sockets/socketEvents';
import Button from '../common/Button';
import Modal from '../common/Modal';

const ROOM_STATUS_LOBBY     = 'lobby';
const ROOM_STATUS_COMPLETED = 'completed';
const MIN_PLAYERS_PER_ROOM  = 2;

const HostControls = () => {
  const { socket }  = useSocket();
  const { room }    = useSelector((state) => state.room);
  const { user }    = useSelector((state) => state.auth);
  const { teams }   = useSelector((state) => state.team);
  const isPaused    = useSelector((state) => state.auction?.isPaused ?? false);

  const [confirmAction, setConfirmAction] = useState(null);

  const isHost = Boolean(room) && Boolean(user) && room.hostUserId === user._id;
  if (!isHost || !room || room.status === ROOM_STATUS_COMPLETED) return null;

  const emit = (eventName) => socket.emit(eventName, { roomCode: room.roomCode });

  /* ── Lobby view: start button ── */
  if (room.status === ROOM_STATUS_LOBBY) {
    const canStart = teams.length >= MIN_PLAYERS_PER_ROOM;

    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-sm font-bold text-neutral-100">Host Controls</h2>

        <p className="mt-1.5 text-sm text-neutral-500">
          {canStart
            ? `${teams.length} franchise${teams.length !== 1 ? 's' : ''} ready — start whenever you like.`
            : `Need at least ${MIN_PLAYERS_PER_ROOM} franchises to start (${teams.length}/${MIN_PLAYERS_PER_ROOM} joined).`}
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

  /* ── In-auction view: pause / restart / end ── */
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
        <span className="mr-auto text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Host
        </span>

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
          End
        </Button>
      </div>

      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'restart' ? 'Restart the auction?' : 'End the auction?'}
        size="sm"
      >
        <p className="text-sm leading-relaxed text-neutral-400">
          {confirmAction === 'restart'
            ? 'This resets every sale and every budget back to zero. It cannot be undone.'
            : 'This ends the auction immediately and locks in the current results. It cannot be undone.'}
        </p>

        <div className="mt-5 flex justify-end gap-2">
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
            {confirmAction === 'restart' ? 'Yes, restart' : 'Yes, end'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default HostControls;