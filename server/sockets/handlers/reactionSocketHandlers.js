// server/sockets/handlers/reactionSocketHandlers.js

const { REACTION_EVENTS } = require('../../constants/socketEvents');

// Allowed emojis — whitelist so clients can't send arbitrary strings or
// inject HTML. Exactly the 8 emojis shown in the client EmojiReactionBar.
const ALLOWED_EMOJIS = new Set([
  '🔥', '😱', '🤑', '👏', '💀', '🚀', '😤', '💰',
]);

// Per-socket rate limit: one reaction per COOLDOWN_MS.
// Stored in a Map keyed by socket.id so it resets when the socket
// disconnects — no memory leak across sessions.
const COOLDOWN_MS = 2000;
const lastReactionAt = new Map();

const registerReactionHandlers = (io, socket) => {
  socket.on(REACTION_EVENTS.SEND, ({ emoji, roomCode } = {}) => {
    // ── Validation ────────────────────────────────────────────────────
    if (!emoji || !roomCode) return;

    if (!ALLOWED_EMOJIS.has(emoji)) return;

    const normalizedRoom = roomCode.toUpperCase();

    // ── Rate limit ────────────────────────────────────────────────────
    const now  = Date.now();
    const last = lastReactionAt.get(socket.id) ?? 0;
    if (now - last < COOLDOWN_MS) return;
    lastReactionAt.set(socket.id, now);

    // ── Broadcast ─────────────────────────────────────────────────────
    // Include sender name and team name so the overlay can show who sent
    // the reaction without a DB round-trip.
    io.to(normalizedRoom).emit(REACTION_EVENTS.RECEIVED, {
      emoji,
      senderName: socket.user?.name ?? 'Unknown',
      id:         `${socket.id}-${now}`,
    });
  });

  // Clean up rate-limit entry when this socket disconnects so the Map
  // never grows unboundedly across a long-running server session.
  socket.on('disconnect', () => {
    lastReactionAt.delete(socket.id);
  });
};

module.exports = registerReactionHandlers;