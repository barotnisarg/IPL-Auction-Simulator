// client/src/pages/UnsoldSelectionPage.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import useSocket from '../hooks/useSocket';
import { ROOM_EVENTS } from '../sockets/socketEvents';
import Loader from '../components/common/Loader';
import Countdown from '../components/common/Countdown';
import UnsoldPlayerGrid from '../components/unsold/UnsoldPlayerGrid';

const ROOM_STATUS_LOBBY        = 'lobby';
const ROOM_STATUS_MINI_AUCTION = 'mini-auction';
const ROOM_STATUS_COMPLETED    = 'completed';

const REDIRECT_BY_STATUS = {
  [ROOM_STATUS_LOBBY]:        (roomCode) => `/lobby/${roomCode}`,
  [ROOM_STATUS_MINI_AUCTION]: (roomCode) => `/auction/${roomCode}`,
  [ROOM_STATUS_COMPLETED]:    (roomCode) => `/results/${roomCode}`,
};

const UnsoldSelectionPage = () => {
  const { roomCode } = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { socket }   = useSocket();

  const { room, status: roomStatus }                          = useSelector((s) => s.room);
  const { unsoldPlayerCount, durationSeconds, isRoundActive } = useSelector((s) => s.unsold);

  const [hasLocalTimerExpired, setHasLocalTimerExpired] = useState(false);

  useEffect(() => { dispatch(fetchRoomByCode(roomCode)); }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) dispatch(fetchTeamsByRoom(room._id));
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (socket && roomCode) socket.emit(ROOM_EVENTS.JOIN, { roomCode });
  }, [socket, roomCode]);

  useEffect(() => {
    if (!room) return;
    const redirectFor = REDIRECT_BY_STATUS[room.status];
    if (redirectFor) navigate(redirectFor(room.roomCode), { replace: true });
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) return <Loader fullScreen label="Loading..." />;
  if (!room) return null;

  const isExpired = hasLocalTimerExpired && isRoundActive;

  return (
    <div className="min-h-dvh bg-neutral-950">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-neutral-100">
            Cric<span className="text-amber-400">Bid</span>
          </span>
          {durationSeconds !== null && (
            <Countdown
              totalSeconds={durationSeconds}
              isActive={isRoundActive && !hasLocalTimerExpired}
              onExpire={() => setHasLocalTimerExpired(true)}
              variant="ring"
              size="sm"
            />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Page heading */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Unsold Round
          </span>

          <h1 className="mt-4 text-2xl font-black text-neutral-100">
            Pick your targets
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {unsoldPlayerCount} player{unsoldPlayerCount === 1 ? '' : 's'} available.
            Your picks stay hidden from every other team until the round closes.
          </p>
        </div>

        {/* Timer — prominent when not expired */}
        {durationSeconds !== null && !isExpired && (
          <div className="mt-8 flex justify-center">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-8 py-5 text-center">
              <Countdown
                totalSeconds={durationSeconds}
                isActive={isRoundActive && !hasLocalTimerExpired}
                onExpire={() => setHasLocalTimerExpired(true)}
                variant="text"
                size="lg"
                label="Time remaining"
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="mt-8">
          {isExpired ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
                <svg className="h-6 w-6 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-300">Time&apos;s up</p>
              <p className="mt-1 text-sm text-neutral-600">
                Finalising every team&apos;s selections...
              </p>
            </div>
          ) : (
            <UnsoldPlayerGrid />
          )}
        </div>
      </main>
    </div>
  );
};

export default UnsoldSelectionPage;