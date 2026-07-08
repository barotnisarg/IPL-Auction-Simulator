// client/src/sockets/socketEvents.js

export const ROOM_EVENTS = {
  JOIN:    'room:join',
  LEAVE:   'room:leave',
  UPDATED: 'room:updated',
  ERROR:   'room:error',
};

export const AUCTION_EVENTS = {
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
};

export const UNSOLD_EVENTS = {
  SUBMIT_SELECTION:    'unsold:submit-selection',
  SELECTION_CONFIRMED: 'unsold:selection-confirmed',
  ROUND_STARTED:       'unsold:round-started',
  ROUND_ENDED:         'unsold:round-ended',
  ERROR:               'unsold:error',
};

// Emoji reactions — mirrors server/constants/socketEvents.js exactly.
export const REACTION_EVENTS = {
  SEND:     'reaction:send',
  RECEIVED: 'reaction:received',
};