// server/constants/socketEvents.js

const ROOM_EVENTS = Object.freeze({
  JOIN:    'room:join',
  LEAVE:   'room:leave',
  UPDATED: 'room:updated',
  ERROR:   'room:error',
});

const AUCTION_EVENTS = Object.freeze({
  START:            'auction:start',
  PAUSE:            'auction:pause',
  RESUME:           'auction:resume',
  RESTART:          'auction:restart',
  END:              'auction:end',
  PLACE_BID:        'auction:place-bid',
  SKIP_BID:         'auction:skip-bid',
  CATEGORY_STARTED: 'auction:category-started',
  STATE_UPDATE:     'auction:state-update',
  TIMER_TICK:       'auction:timer-tick',
  PLAYER_SOLD:      'auction:player-sold',
  PLAYER_UNSOLD:    'auction:player-unsold',
  ENDED:            'auction:ended',
  ERROR:            'auction:error',
});

const UNSOLD_EVENTS = Object.freeze({
  SUBMIT_SELECTION:    'unsold:submit-selection',
  SELECTION_CONFIRMED: 'unsold:selection-confirmed',
  ROUND_STARTED:       'unsold:round-started',
  ROUND_ENDED:         'unsold:round-ended',
  ERROR:               'unsold:error',
});

// Emoji reactions — ephemeral, never persisted.
// client -> server: SEND (one emoji + roomCode)
// server -> all clients in room: RECEIVED (emoji + sender info)
const REACTION_EVENTS = Object.freeze({
  SEND:     'reaction:send',
  RECEIVED: 'reaction:received',
});

module.exports = {
  ROOM_EVENTS,
  AUCTION_EVENTS,
  UNSOLD_EVENTS,
  REACTION_EVENTS,
};