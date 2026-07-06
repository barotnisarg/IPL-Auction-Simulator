// client/src/pages/LobbyPage.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import useSocket from '../hooks/useSocket';
import { ROOM_EVENTS } from '../sockets/socketEvents';
import Loader from '../components/common/Loader';
import RoomCodeDisplay from '../components/lobby/RoomCodeDisplay';
import PlayerList from '../components/lobby/PlayerList';
import HostControls from '../components/lobby/HostControls';

const ROOM_STATUS_LOBBY = 'lobby';

const LobbyPage = () => {
  const { roomCode } = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { socket }   = useSocket();

  const { room, status: roomStatus } = useSelector((state) => state.room);

  useEffect(() => { dispatch(fetchRoomByCode(roomCode)); }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) dispatch(fetchTeamsByRoom(room._id));
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (socket && roomCode) socket.emit(ROOM_EVENTS.JOIN, { roomCode });
  }, [socket, roomCode]);

  useEffect(() => {
    if (room && room.status !== ROOM_STATUS_LOBBY)
      navigate(`/auction/${room.roomCode}`, { replace: true });
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) return <Loader fullScreen label="Loading room..." />;

  if (roomStatus === 'failed' && !room) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-base font-bold text-neutral-100">Room not found.</p>
        <p className="text-sm text-neutral-500">Double-check the room code, or ask your host.</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-dvh bg-neutral-950">
      <header className="border-b border-neutral-900 px-5 py-4">
        <span className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </span>
      </header>

      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Staggered fade-up entrance — each card appears 80ms after the previous */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '0ms' }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Lobby
          </span>
          <h1 className="mt-3 text-xl font-black text-neutral-100">
            Waiting for the auction to begin
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Share the room code so your franchises can join.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
            <RoomCodeDisplay />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
            <PlayerList />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <HostControls />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;