// client/src/sockets/socketEvents.js

// Mirrors server/constants/socketEvents.js exactly. There's no shared
// package across the client/server boundary (see the architecture note on
// why), so these two files are kept in sync by hand. If an event is added,
// renamed, or removed on the server, this file needs the matching change.

export const ROOM_EVENTS = {
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  UPDATED: 'room:updated',
  ERROR: 'room:error',
};

export const AUCTION_EVENTS = {
  START: 'auction:start',
  PAUSE: 'auction:pause',
  RESUME: 'auction:resume',
  RESTART: 'auction:restart',
  END: 'auction:end',
  PLACE_BID: 'auction:place-bid',
  SKIP_BID: 'auction:skip-bid',
  CATEGORY_STARTED: 'auction:category-started',
  STATE_UPDATE: 'auction:state-update',
  TIMER_TICK: 'auction:timer-tick',
  PLAYER_SOLD: 'auction:player-sold',
  PLAYER_UNSOLD: 'auction:player-unsold',
  ENDED: 'auction:ended',
  ERROR: 'auction:error',
};

export const UNSOLD_EVENTS = {
  SUBMIT_SELECTION: 'unsold:submit-selection',
  SELECTION_CONFIRMED: 'unsold:selection-confirmed',
  ROUND_STARTED: 'unsold:round-started',
  ROUND_ENDED: 'unsold:round-ended',
  ERROR: 'unsold:error',
};