// client/src/sockets/listeners/roomListeners.js

import { ROOM_EVENTS } from '../socketEvents';
import { setRoom } from '../../features/room/roomSlice';
import { setTeams } from '../../features/team/teamSlice';

const registerRoomListeners = (socket, dispatch) => {
  const handleRoomUpdated = ({ room, teams }) => {
    dispatch(setRoom(room));
    dispatch(setTeams(teams));
  };

  const handleRoomError = ({ message } = {}) => {
    // No toast/notification system exists yet in this project (see the
    // note on RoomCodeDisplay.jsx using an in-place label instead of one).
    // Surfaced to the console for visibility during development rather
    // than silently swallowed — revisit once a notification system exists.
    console.error('Room socket error:', message);
  };

  socket.on(ROOM_EVENTS.UPDATED, handleRoomUpdated);
  socket.on(ROOM_EVENTS.ERROR, handleRoomError);

  return () => {
    socket.off(ROOM_EVENTS.UPDATED, handleRoomUpdated);
    socket.off(ROOM_EVENTS.ERROR, handleRoomError);
  };
};

export default registerRoomListeners;