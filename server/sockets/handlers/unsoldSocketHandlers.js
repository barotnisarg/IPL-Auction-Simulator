// server/sockets/handlers/unsoldSocketHandlers.js

const { UNSOLD_EVENTS } = require('../../constants/socketEvents');
const { ROOM_STATUS } = require('../../constants/roomConstants');

const Team = require('../../models/Team');
const UnsoldSelection = require('../../models/UnsoldSelection');
const auctionStateStore = require('../../services/auctionEngine/auctionStateStore');

// Same direct Team.findOne({ roomId, userId }) lookup auctionSocketHandlers.js
// already uses for place-bid/skip-bid — a small, deliberate duplication
// rather than extracting a shared helper for one two-line query, consistent
// with that file's own established precedent (see explanation).
const resolveTeamId = async (engine, socket) => {
  const team = await Team.findOne({ roomId: engine.room._id, userId: socket.user._id }).select('_id');
  return team ? team._id : null;
};

const registerUnsoldHandlers = (io, socket) => {
  socket.on(UNSOLD_EVENTS.SUBMIT_SELECTION, async ({ roomCode, selectedPlayerIds } = {}) => {
    try {
      const normalizedRoomCode = roomCode?.toUpperCase();
      const engine = auctionStateStore.getEngine(normalizedRoomCode);

      if (!engine) {
        socket.emit(UNSOLD_EVENTS.ERROR, { message: 'The auction has not started yet.' });
        return;
      }

      if (engine.room.status !== ROOM_STATUS.UNSOLD_SELECTION) {
        socket.emit(UNSOLD_EVENTS.ERROR, {
          message: 'The unsold selection round is not currently open.',
        });
        return;
      }

      if (!Array.isArray(selectedPlayerIds)) {
        socket.emit(UNSOLD_EVENTS.ERROR, { message: 'Selected players must be a list.' });
        return;
      }

      const teamId = await resolveTeamId(engine, socket);

      if (!teamId) {
        socket.emit(UNSOLD_EVENTS.ERROR, { message: 'You do not have a team in this room.' });
        return;
      }

      // De-duplicated here too, even though endRound's merge step would
      // catch it anyway — keeps what's actually stored for this one team
      // honest and minimal, not just whatever the client happened to send.
      const uniquePlayerIds = Array.from(new Set(selectedPlayerIds.map(String)));

      const selection = await UnsoldSelection.findOneAndUpdate(
        { roomId: engine.room._id, teamId },
        {
          selectedPlayerIds: uniquePlayerIds,
          isFinalized: true,
          submittedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Confirmation goes to this one socket only — the entire point of a
      // secret round is that no other team ever learns what anyone picked.
      socket.emit(UNSOLD_EVENTS.SELECTION_CONFIRMED, {
        selectedPlayerIds: selection.selectedPlayerIds,
        submittedAt: selection.submittedAt,
      });
    } catch (error) {
      socket.emit(UNSOLD_EVENTS.ERROR, { message: 'Failed to submit your selection.' });
    }
  });
};

module.exports = registerUnsoldHandlers;