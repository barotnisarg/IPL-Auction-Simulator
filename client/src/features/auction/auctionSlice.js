// client/src/features/auction/auctionSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { setRoom } from '../room/roomSlice';

const ROOM_STATUS_LOBBY = 'lobby';

const initialState = {
  currentPlayer: null,
  currentBidLakhs: null,
  highestBidderTeamId: null,
  secondsRemaining: null,
  isPaused: false,
  teamSummaries: [],
  currentPlayerBidLog: [],
  auctionHistory: [],
  lastResolvedPlayer: null,

  // Set when CATEGORY_STARTED fires. Persists for the entire category so
  // the "View List" panel can always be reopened. Never nulled out — the
  // panel button and panel both read this field and must stay populated.
  activeCategoryPlayers: null,

  // Outcome of every resolved player, keyed by player._id.toString().
  // Value: { type: 'sold'|'unsold', teamName?, priceLakhs? }
  playerOutcomeMap: {},
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    applyStateUpdate: (state, action) => {
      const payload = action.payload;
      const isNewPlayer =
        (payload.currentPlayer?._id ?? null) !== (state.currentPlayer?._id ?? null);

      if (isNewPlayer) {
        state.currentPlayerBidLog = [];
      } else if (
        payload.currentBidLakhs !== null &&
        payload.currentBidLakhs !== state.currentBidLakhs
      ) {
        state.currentPlayerBidLog.push({
          teamId: payload.highestBidderTeamId,
          amountLakhs: payload.currentBidLakhs,
        });
      }

      state.currentPlayer = payload.currentPlayer;
      state.currentBidLakhs = payload.currentBidLakhs;
      state.highestBidderTeamId = payload.highestBidderTeamId;
      state.secondsRemaining = payload.secondsRemaining;
      state.isPaused = payload.isPaused;
      state.teamSummaries = payload.teams;
    },

    applyTimerTick: (state, action) => {
      state.secondsRemaining = action.payload.secondsRemaining;
    },

    // Fired when server emits CATEGORY_STARTED (new pool/set begins).
    // Stores the full player list so both the header button and the
    // slide-over panel always have data. Never wiped mid-category.
    applyCategoryStarted: (state, action) => {
      const { category, roleSubPhase, players } = action.payload;
      state.activeCategoryPlayers = {
        category,
        roleSubPhase,
        players: players ?? [],
      };
    },

    recordPlayerSold: (state, action) => {
      const { player, team, priceLakhs } = action.payload;
      state.auctionHistory.push({ type: 'sold', player, team, priceLakhs });
      state.lastResolvedPlayer = { type: 'sold', player, team, priceLakhs };
      state.playerOutcomeMap[player._id.toString()] = {
        type: 'sold',
        teamName: team.teamName,
        priceLakhs,
      };
    },

    recordPlayerUnsold: (state, action) => {
      const { player } = action.payload;
      state.auctionHistory.push({ type: 'unsold', player });
      state.lastResolvedPlayer = { type: 'unsold', player };
      state.playerOutcomeMap[player._id.toString()] = { type: 'unsold' };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(setRoom, (state, action) => {
      if (action.payload?.status === ROOM_STATUS_LOBBY) {
        return initialState;
      }
      return state;
    });
  },
});

export const {
  applyStateUpdate,
  applyTimerTick,
  applyCategoryStarted,
  recordPlayerSold,
  recordPlayerUnsold,
} = auctionSlice.actions;

export default auctionSlice.reducer;