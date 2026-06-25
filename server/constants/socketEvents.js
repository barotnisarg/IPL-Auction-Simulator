// server/constants/socketEvents.js

// Grouped by domain so each value maps 1:1 onto its corresponding handler file
// (roomSocketHandlers.js, auctionSocketHandlers.js, unsoldSocketHandlers.js).
// Wire values use a "domain:action" convention for easy reading in debug logs.

const ROOM_EVENTS = Object.freeze({
  JOIN: 'room:join',           // client -> server: join a room's lobby
  LEAVE: 'room:leave',         // client -> server: leave a room
  UPDATED: 'room:updated',     // server -> all clients in room: full lobby/room snapshot
  ERROR: 'room:error',         // server -> one client: room-action failed
});

const AUCTION_EVENTS = Object.freeze({
  START: 'auction:start',                       // client (host) -> server
  PAUSE: 'auction:pause',                       // client (host) -> server
  RESUME: 'auction:resume',                     // client (host) -> server
  RESTART: 'auction:restart',                   // client (host) -> server
  END: 'auction:end',                           // client (host) -> server
  PLACE_BID: 'auction:place-bid',               // client -> server
  SKIP_BID: 'auction:skip-bid',                 // client -> server
  CATEGORY_STARTED: 'auction:category-started', // server -> all: new phase began (e.g. Pool 1)
  STATE_UPDATE: 'auction:state-update',         // server -> all: full live auction snapshot
  TIMER_TICK: 'auction:timer-tick',             // server -> all: lightweight per-second countdown
  PLAYER_SOLD: 'auction:player-sold',           // server -> all: player sold (player, team, price)
  PLAYER_UNSOLD: 'auction:player-unsold',       // server -> all: player went unsold
  ENDED: 'auction:ended',                       // server -> all: entire auction complete
  ERROR: 'auction:error',                       // server -> one client: bid/control action rejected
});

const UNSOLD_EVENTS = Object.freeze({
  SUBMIT_SELECTION: 'unsold:submit-selection',         // client -> server: secret picks
  SELECTION_CONFIRMED: 'unsold:selection-confirmed',   // server -> one client: receipt ack
  ROUND_STARTED: 'unsold:round-started',               // server -> all: 5-min window opened
  ROUND_ENDED: 'unsold:round-ended',                    // server -> all: window closed, pool merged
  ERROR: 'unsold:error',                                // server -> one client: selection rejected
});

module.exports = {
  ROOM_EVENTS,
  AUCTION_EVENTS,
  UNSOLD_EVENTS,
};