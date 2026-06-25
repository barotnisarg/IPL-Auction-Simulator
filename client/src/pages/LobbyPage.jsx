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

const ROOM_STATUS_LOBBY = 'lobby'; // mirrored from server/constants/roomConstants.js

const LobbyPage = () => {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { room, status: roomStatus } = useSelector((state) => state.room);

  useEffect(() => {
    dispatch(fetchRoomByCode(roomCode));
  }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) {
      dispatch(fetchTeamsByRoom(room._id));
    }
  }, [room?._id, dispatch]);

  // Registers this socket with the room's broadcast channel. The actual
  // listeners that react to "someone joined" / "auction started" events
  // live in sockets/listeners/roomListeners.js — not built yet (Phase 6).
  useEffect(() => {
    if (socket && roomCode) {
      socket.emit(ROOM_EVENTS.JOIN, { roomCode });
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (room && room.status !== ROOM_STATUS_LOBBY) {
      navigate(`/auction/${room.roomCode}`, { replace: true });
    }
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading room..." />;
  }

  if (roomStatus === 'failed' && !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-100">Room not found.</p>
        <p className="mt-2 text-sm text-neutral-400">
          Double check the room code, or ask your host to share it again.
        </p>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-amber-400">
        Lobby
      </p>
      <h1 className="mt-2 text-center text-2xl font-bold text-neutral-100">
        Waiting for the auction to begin
      </h1>

      <div className="mt-8 space-y-6">
        <RoomCodeDisplay />
        <PlayerList />
        <HostControls />
      </div>
    </div>
  );
};

export default LobbyPage;