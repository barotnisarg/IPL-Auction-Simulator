// server/services/auctionEngine/unsoldRoundManager.js

const { UNSOLD_SELECTION_TIMER_SECONDS } = require('../../constants/auctionConstants');
const { UNSOLD_EVENTS } = require('../../constants/socketEvents');

const UnsoldSelection = require('../../models/UnsoldSelection');
const playerService = require('../playerService');
const shuffleArray = require('../../utils/shuffleArray');
const { startCountdown } = require('./timerManager');

const getUnsoldPlayerIds = (engine) =>
  engine.room.auctionLog
    .filter((entry) => entry.result === 'unsold')
    .map((entry) => entry.playerId.toString());

const endRound = async (engine, io, roomCode) => {
  try {
    const unsoldPlayerIds = new Set(getUnsoldPlayerIds(engine));

    const selections = await UnsoldSelection.find({ roomId: engine.room._id });

    const mergedIds = new Set();
    selections.forEach((selection) => {
      selection.selectedPlayerIds.forEach((playerId) => {
        const idString = playerId.toString();
        if (unsoldPlayerIds.has(idString)) {
          mergedIds.add(idString);
        }
      });
    });

    if (mergedIds.size === 0) {
      io.to(roomCode).emit(UNSOLD_EVENTS.ROUND_ENDED, { miniAuctionPoolSize: 0 });
      await engine.end();
      return;
    }

    const players = await playerService.getPlayersByIds(Array.from(mergedIds));
    const shuffledQueue = shuffleArray(players);

    io.to(roomCode).emit(UNSOLD_EVENTS.ROUND_ENDED, {
      miniAuctionPoolSize: shuffledQueue.length,
    });

    await engine.beginMiniAuction(shuffledQueue);
  } catch (error) {
    io.to(roomCode).emit(UNSOLD_EVENTS.ERROR, {
      message: 'Failed to process the unsold selection round.',
    });
  }
};

const startRound = async (engine, io, roomCode) => {
  await UnsoldSelection.deleteMany({ roomId: engine.room._id });

  const unsoldPlayerIds = getUnsoldPlayerIds(engine);

  if (unsoldPlayerIds.length === 0) {
    io.to(roomCode).emit(UNSOLD_EVENTS.ROUND_ENDED, { miniAuctionPoolSize: 0 });
    await engine.end();
    return;
  }

  // Fetched and broadcast in full now, not just counted — this is what
  // UnsoldPlayerGrid.jsx actually renders checkboxes against, and it's
  // correct for every client regardless of when they connected, since it
  // comes from the server's own authoritative room.auctionLog rather than
  // anything accumulated client-side.
  const unsoldPlayers = await playerService.getPlayersByIds(unsoldPlayerIds);

  io.to(roomCode).emit(UNSOLD_EVENTS.ROUND_STARTED, {
    unsoldPlayers,
    unsoldPlayerCount: unsoldPlayers.length,
    durationSeconds: UNSOLD_SELECTION_TIMER_SECONDS,
  });

  startCountdown({
    durationSeconds: UNSOLD_SELECTION_TIMER_SECONDS,
    onExpire: () => {
      endRound(engine, io, roomCode);
    },
  });
};

module.exports = { startRound };