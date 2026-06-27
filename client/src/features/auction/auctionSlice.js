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

  // Category intro modal data — set whenever a new pool/set starts.
  activeCategoryIntro: null,

  // Tracks outcome of every player resolved so far, keyed by player._id.
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

    applyCategoryStarted: (state, action) => {
      const { category, roleSubPhase, players } = action.payload;
      state.activeCategoryIntro = { category, roleSubPhase, players: players ?? [] };
    },

    dismissCategoryIntro: (state) => {
      state.activeCategoryIntro = null;
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
  dismissCategoryIntro,
  recordPlayerSold,
  recordPlayerUnsold,
} = auctionSlice.actions;

export default auctionSlice.reducer;