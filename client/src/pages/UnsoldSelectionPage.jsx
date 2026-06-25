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

// Mirrored from server/constants/roomConstants.js.
const ROOM_STATUS_LOBBY = 'lobby';
const ROOM_STATUS_MINI_AUCTION = 'mini-auction';
const ROOM_STATUS_COMPLETED = 'completed';

// 'completed' is a real destination from here, not just a defensive
// catch-all — both unsoldRoundManager.startRound (zero unsold players) and
// endRound (zero players actually picked by anyone) call engine.end()
// directly, skipping the Mini-Auction entirely. A client could be sitting
// on this exact page when that happens.
const REDIRECT_BY_STATUS = {
  [ROOM_STATUS_LOBBY]: (roomCode) => `/lobby/${roomCode}`,
  [ROOM_STATUS_MINI_AUCTION]: (roomCode) => `/auction/${roomCode}`,
  [ROOM_STATUS_COMPLETED]: (roomCode) => `/results/${roomCode}`,
};

const UnsoldSelectionPage = () => {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { room, status: roomStatus } = useSelector((state) => state.room);
  const { unsoldPlayerCount, durationSeconds, isRoundActive } = useSelector(
    (state) => state.unsold
  );

  const [hasLocalTimerExpired, setHasLocalTimerExpired] = useState(false);

  useEffect(() => {
    dispatch(fetchRoomByCode(roomCode));
  }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) {
      dispatch(fetchTeamsByRoom(room._id));
    }
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (socket && roomCode) {
      socket.emit(ROOM_EVENTS.JOIN, { roomCode });
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const redirectFor = REDIRECT_BY_STATUS[room.status];

    if (redirectFor) {
      navigate(redirectFor(room.roomCode), { replace: true });
    }
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading..." />;
  }

  if (!room) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-amber-400">
        Unsold Player Selection
      </p>
      <h1 className="mt-2 text-center text-2xl font-bold text-neutral-100">
        Pick your targets from the unsold pool
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-400">
        {unsoldPlayerCount} player{unsoldPlayerCount === 1 ? '' : 's'} available. Your picks stay
        hidden from every other team until the round closes.
      </p>

      <div className="mt-6 flex justify-center">
        {durationSeconds !== null && (
          <Countdown
            totalSeconds={durationSeconds}
            isActive={isRoundActive && !hasLocalTimerExpired}
            onExpire={() => setHasLocalTimerExpired(true)}
            variant="text"
            size="lg"
            label="Time remaining"
          />
        )}
      </div>

      <div className="mt-6">
        {hasLocalTimerExpired && isRoundActive ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
            <p className="text-sm text-neutral-400">
              Time&apos;s up — finalizing every team&apos;s selections...
            </p>
          </div>
        ) : (
          <UnsoldPlayerGrid />
        )}
      </div>
    </div>
  );
};

export default UnsoldSelectionPage;