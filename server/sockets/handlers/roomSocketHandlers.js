// server/sockets/handlers/roomSocketHandlers.js

const { ROOM_EVENTS } = require('../../constants/socketEvents');
const Room = require('../../models/Room');
const Team = require('../../models/Team');

// Reused by auctionSocketHandlers.js (Phase 7) whenever Room.status changes
// (e.g. the host starting the auction) — one place that knows how to fetch
// and broadcast a fresh room+teams snapshot, not duplicated per handler file.
const broadcastRoomUpdate = async (io, roomCode) => {
  const room = await Room.findOne({ roomCode });

  if (!room) {
    return;
  }

  const teams = await Team.find({ roomId: room._id }).sort({ createdAt: 1 });

  io.to(roomCode).emit(ROOM_EVENTS.UPDATED, { room, teams });
};

const registerRoomHandlers = (io, socket) => {
  socket.on(ROOM_EVENTS.JOIN, async ({ roomCode } = {}) => {
    try {
      if (!roomCode) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Room code is required.' });
        return;
      }

      const normalizedRoomCode = roomCode.toUpperCase();
      const room = await Room.findOne({ roomCode: normalizedRoomCode });

      if (!room) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Room not found.' });
        return;
      }

      socket.join(normalizedRoomCode);
      socket.currentRoomCode = normalizedRoomCode;

      await broadcastRoomUpdate(io, normalizedRoomCode);
    } catch (error) {
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to join room.' });
    }
  });

  socket.on(ROOM_EVENTS.LEAVE, ({ roomCode } = {}) => {
    if (!roomCode) {
      return;
    }

    const normalizedRoomCode = roomCode.toUpperCase();
    socket.leave(normalizedRoomCode);

    if (socket.currentRoomCode === normalizedRoomCode) {
      socket.currentRoomCode = null;
    }
  });
};

registerRoomHandlers.broadcastRoomUpdate = broadcastRoomUpdate;

module.exports = registerRoomHandlers;