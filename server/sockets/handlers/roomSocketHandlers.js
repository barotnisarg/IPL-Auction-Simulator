// server/sockets/handlers/roomSocketHandlers.js

const { ROOM_EVENTS } = require('../../constants/socketEvents');
const Room = require('../../models/Room');
const Team = require('../../models/Team');

// IMPORTANT: .populate('userId', 'name') MUST be kept here. BidControls.jsx
// identifies the current user's team via team.userId._id === user._id.
// Without populate, userId arrives as a raw ObjectId string and .userId._id
// is undefined — myTeamRecord lookup fails and the bid button disappears on
// every category transition.
const broadcastRoomUpdate = async (io, roomCode) => {
  const room = await Room.findOne({ roomCode });

  if (!room) {
    return;
  }

  const teams = await Team.find({ roomId: room._id })
    .sort({ createdAt: 1 })
    .populate('userId', 'name')
    .populate('squad.playerId', 'name country imageUrl');

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

      // If an auction engine is already running for this room, send the
      // joining client the current auction state immediately. Without this,
      // a mid-auction page refresh or late-join misses the last STATE_UPDATE
      // and currentPlayer stays null — the bid button never appears.
      const auctionStateStore = require('../../services/auctionEngine/auctionStateStore');
      const engine = auctionStateStore.getEngine(normalizedRoomCode);
      if (engine) {
        const { AUCTION_EVENTS } = require('../../constants/socketEvents');
        socket.emit(AUCTION_EVENTS.STATE_UPDATE, engine.getStateSnapshot());
      }
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