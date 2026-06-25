// client/src/features/auction/auctionSlice.js

import { createSlice } from '@reduxjs/toolkit';

import { setRoom } from '../room/roomSlice';

// Mirrored from server/constants/roomConstants.js — same convention already
// used in HostControls.jsx and LobbyPage.jsx.
const ROOM_STATUS_LOBBY = 'lobby';

const initialState = {
  currentPlayer: null,
  currentBidLakhs: null,
  highestBidderTeamId: null,
  secondsRemaining: null,
  isPaused: false,
  // Live, frequently-updated per-team summaries from the engine's own
  // getStateSnapshot() — { teamId, teamName, budgetRemainingLakhs, squadSize,
  // bowlingOptionsCount, wicketkeeperCount }. Deliberately NOT named "teams"
  // and deliberately NOT the same data as state.team.teams: that slice holds
  // full Team documents (full squad arrays, userId, roomId), refreshed only
  // at category boundaries via ROOM_EVENTS.UPDATED. This is the lightweight,
  // every-single-bid version, used by MyTeamPanel.jsx/OtherTeamsPanel.jsx so
  // they never need to re-derive bowling-option/WK counts client-side.
  teamSummaries: [],
  // Reconstructed entirely client-side — see explanation. Resets whenever
  // currentPlayer changes.
  currentPlayerBidLog: [],
  // Accumulated client-side from PLAYER_SOLD/PLAYER_UNSOLD events, for
  // HistoryPanel.jsx's "auction history" mode. See explanation for why this
  // can't simply read Room.auctionLog from roomSlice instead.
  auctionHistory: [],
  // Brief "outcome" hook for AuctionPlayerCard.jsx (Phase 7, still ahead) to
  // show a "SOLD!"/"UNSOLD" overlay before the next player's state-update
  // arrives and overwrites currentPlayer.
  lastResolvedPlayer: null,
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    applyStateUpdate: (state, action) => {
      const payload = action.payload;
      const isNewPlayer = (payload.currentPlayer?._id ?? null) !== (state.currentPlayer?._id ?? null);

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
      // payload.status / payload.currentRoleSubPhase / payload.roomId are
      // intentionally not stored here — see explanation.
    },
    applyTimerTick: (state, action) => {
      state.secondsRemaining = action.payload.secondsRemaining;
    },
    recordPlayerSold: (state, action) => {
      const { player, team, priceLakhs } = action.payload;
      state.auctionHistory.push({ type: 'sold', player, team, priceLakhs });
      state.lastResolvedPlayer = { type: 'sold', player, team, priceLakhs };
    },
    recordPlayerUnsold: (state, action) => {
      const { player } = action.payload;
      state.auctionHistory.push({ type: 'unsold', player });
      state.lastResolvedPlayer = { type: 'unsold', player };
    },
  },
  extraReducers: (builder) => {
    // Cross-slice reaction, same pattern teamSlice.js already established:
    // whenever a fresh Room snapshot puts the room back into "lobby" — the
    // very first time, or after a host restart — wipe every locally-
    // accumulated piece of auction state back to a clean slate. See
    // explanation for why this is the one place that can correctly catch
    // both cases with no new socket event needed.
    builder.addCase(setRoom, (state, action) => {
      if (action.payload?.status === ROOM_STATUS_LOBBY) {
        return initialState;
      }
      return state;
    });
  },
});

export const { applyStateUpdate, applyTimerTick, recordPlayerSold, recordPlayerUnsold } =
  auctionSlice.actions;
export default auctionSlice.reducer;