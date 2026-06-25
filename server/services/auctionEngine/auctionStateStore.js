// server/services/auctionEngine/auctionStateStore.js

// A generic, per-key, concurrency-safe "build once" registry. The caller
// supplies how to construct a fresh engine; this file's only job is making
// sure that construction happens at most once per room, no matter how many
// near-simultaneous calls ask for it.
const engines = new Map(); // roomCode -> AuctionEngine instance, or an in-flight creation Promise

const getEngine = (roomCode) => {
  const entry = engines.get(roomCode);
  return entry instanceof Promise ? undefined : entry;
};

const getOrCreateEngine = (roomCode, createEngine) => {
  const existing = engines.get(roomCode);

  if (existing) {
    // Either an already-built engine or a creation already in flight —
    // returning it directly means a second near-simultaneous call never
    // starts a second, conflicting build.
    return existing;
  }

  const creationPromise = createEngine()
    .then((engine) => {
      engines.set(roomCode, engine);
      return engine;
    })
    .catch((error) => {
      engines.delete(roomCode); // don't leave a failed build cached forever
      throw error;
    });

  // Set synchronously, before this function's only await-equivalent point.
  // This is what actually closes the race: nothing can interleave between
  // the check above and this line within a single JS event-loop turn.
  engines.set(roomCode, creationPromise);

  return creationPromise;
};

const removeEngine = (roomCode) => {
  engines.delete(roomCode);
};

module.exports = {
  getEngine,
  getOrCreateEngine,
  removeEngine,
};