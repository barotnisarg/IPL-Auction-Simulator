// server/sockets/handlers/auctionSocketHandlers.js

const Room = require('../../models/Room');
const Team = require('../../models/Team');
const AuctionEngine = require('../../services/auctionEngine/AuctionEngine');
const auctionStateStore = require('../../services/auctionEngine/auctionStateStore');
const unsoldRoundManager = require('../../services/auctionEngine/unsoldRoundManager');
const registerRoomHandlers = require('./roomSocketHandlers');

const { AUCTION_EVENTS } = require('../../constants/socketEvents');
const { ROOM_STATUS } = require('../../constants/roomConstants');

const wireEngineBroadcasts = (io, roomCode, engine) => {
  engine.on('category-started', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.CATEGORY_STARTED, payload);
    registerRoomHandlers.broadcastRoomUpdate(io, roomCode);

    // AuctionEngine._advanceToNextPhase deliberately goes idle the instant
    // it enters this status ("Engine goes idle until Phase 9 calls
    // beginMiniAuction") — this is the one place that notices the
    // transition and actually kicks the 5-minute round off.
    if (engine.room.status === ROOM_STATUS.UNSOLD_SELECTION) {
      unsoldRoundManager.startRound(engine, io, roomCode).catch((error) => {
        io.to(roomCode).emit(AUCTION_EVENTS.ERROR, {
          message: error.message || 'Failed to start the unsold selection round.',
        });
      });
    }
  });

  engine.on('state-update', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.STATE_UPDATE, payload);
  });

  engine.on('timer-tick', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.TIMER_TICK, payload);
  });

  engine.on('player-sold', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.PLAYER_SOLD, payload);
  });

  engine.on('player-unsold', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.PLAYER_UNSOLD, payload);
  });

  engine.on('ended', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.ENDED, payload);
    registerRoomHandlers.broadcastRoomUpdate(io, roomCode);
    auctionStateStore.removeEngine(roomCode);
  });

  engine.on('error', (payload) => {
    io.to(roomCode).emit(AUCTION_EVENTS.ERROR, payload);
  });
};

const buildEngine = (roomCode, io) => async () => {
  const room = await Room.findOne({ roomCode });

  if (!room) {
    throw new Error('Room not found.');
  }

  const teams = await Team.find({ roomId: room._id });
  const engine = new AuctionEngine({ room, teams });

  wireEngineBroadcasts(io, roomCode, engine);

  return engine;
};

const requireHostEngine = (roomCode, socket) => {
  const engine = auctionStateStore.getEngine(roomCode);

  if (!engine) {
    socket.emit(AUCTION_EVENTS.ERROR, { message: 'The auction has not started yet.' });
    return null;
  }

  if (engine.room.hostUserId.toString() !== socket.user._id.toString()) {
    socket.emit(AUCTION_EVENTS.ERROR, { message: 'Only the host can perform this action.' });
    return null;
  }

  return engine;
};

const resolveTeamId = async (engine, socket) => {
  const team = await Team.findOne({ roomId: engine.room._id, userId: socket.user._id }).select('_id');
  return team ? team._id : null;
};

const registerAuctionHandlers = (io, socket) => {
  socket.on(AUCTION_EVENTS.START, async ({ roomCode } = {}) => {
    try {
      if (!roomCode) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'Room code is required.' });
        return;
      }

      const normalizedRoomCode = roomCode.toUpperCase();
      const room = await Room.findOne({ roomCode: normalizedRoomCode });

      if (!room) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'Room not found.' });
        return;
      }

      if (room.hostUserId.toString() !== socket.user._id.toString()) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'Only the host can start the auction.' });
        return;
      }

      const engine = await auctionStateStore.getOrCreateEngine(
        normalizedRoomCode,
        buildEngine(normalizedRoomCode, io)
      );

      await engine.start();
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to start auction.' });
    }
  });

  socket.on(AUCTION_EVENTS.PAUSE, ({ roomCode } = {}) => {
    try {
      const engine = requireHostEngine(roomCode?.toUpperCase(), socket);
      if (!engine) return;
      engine.pause();
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to pause auction.' });
    }
  });

  socket.on(AUCTION_EVENTS.RESUME, ({ roomCode } = {}) => {
    try {
      const engine = requireHostEngine(roomCode?.toUpperCase(), socket);
      if (!engine) return;
      engine.resume();
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to resume auction.' });
    }
  });

  socket.on(AUCTION_EVENTS.RESTART, async ({ roomCode } = {}) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      const engine = requireHostEngine(normalizedRoomCode, socket);
      if (!engine) return;

      await engine.restart();
      await registerRoomHandlers.broadcastRoomUpdate(io, normalizedRoomCode);
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to restart auction.' });
    }
  });

  socket.on(AUCTION_EVENTS.END, async ({ roomCode } = {}) => {
    try {
      const engine = requireHostEngine(roomCode?.toUpperCase(), socket);
      if (!engine) return;
      await engine.end();
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to end auction.' });
    }
  });

  socket.on(AUCTION_EVENTS.PLACE_BID, async ({ roomCode } = {}) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      const engine = auctionStateStore.getEngine(normalizedRoomCode);

      if (!engine) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'The auction has not started yet.' });
        return;
      }

      const teamId = await resolveTeamId(engine, socket);

      if (!teamId) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'You do not have a team in this room.' });
        return;
      }

      await engine.placeBid(teamId);
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to place bid.' });
    }
  });

  socket.on(AUCTION_EVENTS.SKIP_BID, async ({ roomCode } = {}) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      const engine = auctionStateStore.getEngine(normalizedRoomCode);

      if (!engine) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'The auction has not started yet.' });
        return;
      }

      const teamId = await resolveTeamId(engine, socket);

      if (!teamId) {
        socket.emit(AUCTION_EVENTS.ERROR, { message: 'You do not have a team in this room.' });
        return;
      }

      await engine.skipBid(teamId);
    } catch (error) {
      socket.emit(AUCTION_EVENTS.ERROR, { message: error.message || 'Failed to skip.' });
    }
  });
};

module.exports = registerAuctionHandlers;