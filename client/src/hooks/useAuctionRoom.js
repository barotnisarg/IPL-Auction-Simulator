// client/src/hooks/useAuctionRoom.js

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import useSocket from './useSocket';
import { ROOM_EVENTS } from '../sockets/socketEvents';

// Mirrored from server/constants/roomConstants.js — same convention already
// used in HostControls.jsx and LobbyPage.jsx.
const ROOM_STATUS_LOBBY = 'lobby';
const ROOM_STATUS_UNSOLD_SELECTION = 'unsold-selection';
const ROOM_STATUS_COMPLETED = 'completed';

// Where this page sends the user once status leaves the "active bidding"
// set (marquee/pool1/pool2/mini-auction). Lobby is included deliberately —
// HostControls.jsx renders its Restart button on this very page, and a
// restart flips status back to "lobby." Everyone watching the auction needs
// to be bounced back, not just whoever happens to already be on LobbyPage.
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

  // Re-subscribes this socket to the room's channel even on a connection
  // that never passed through LobbyPage (a direct link, a refresh mid-
  // auction). Idempotent server-side, and — same precedent LobbyPage.jsx
  // already set — there's no LEAVE on unmount; moving between pages
  // within the same room isn't "leaving" it.
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

  return { room, roomStatus, teams, auction };
};

export default useAuctionRoom;