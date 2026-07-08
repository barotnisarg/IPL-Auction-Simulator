// client/src/sockets/listeners/reactionListeners.js

// NOTE: Reaction listeners are registered directly inside useReactions.js
// (via socket.on inside a useEffect) rather than in the centralised
// listener pattern used for auction events. This is intentional:
//
// - Auction listeners need to dispatch to Redux because auction state
//   (currentPlayer, bids, timer) drives the whole UI and must persist
//   across component mounts/unmounts.
//
// - Reactions are ephemeral display-only events. They live in a local
//   useState queue inside useReactions, auto-expire after 2.4s, and
//   have no business being in the global Redux store. Keeping them
//   local means zero store pollution and zero need to clean them up
//   in reducers.
//
// This file exists purely as documentation so future developers
// understand the intentional architectural difference.

export {};