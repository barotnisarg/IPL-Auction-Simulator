// client/src/hooks/useAuctionRoom.js

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import useSocket from './useSocket';
import { ROOM_EVENTS } from '../sockets/socketEvents';

const ROOM_STATUS_LOBBY = 'lobby';
const ROOM_STATUS_UNSOLD_SELECTION = 'unsold-selection';
const ROOM_STATUS_COMPLETED = 'completed';

const REDIRECT_BY_STATUS = {
  [ROOM_STATUS_LOBBY]: (roomCode) => `/lobby/${roomCode}`,
  [ROOM_STATUS_UNSOLD_SELECTION]: (roomCode) => `/unsold-selection/${roomCode}`,
  [ROOM_STATUS_COMPLETED]: (roomCode) => `/results/${roomCode}`,
};

const useAuctionRoom = (roomCode) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { room, status: roomStatus } = useSelector((state) => state.room);
  const { teams } = useSelector((state) => state.team);
  const auction = useSelector((state) => state.auction);

  useEffect(() => {
    dispatch(fetchRoomByCode(roomCode));
  }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) {
      dispatch(fetchTeamsByRoom(room._id));
    }
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const joinRoom = () => {
      socket.emit(ROOM_EVENTS.JOIN, { roomCode });
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
    };
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

  return { room, roomStatus, teams, auction };
};

export default useAuctionRoom;