// client/src/features/unsold/unsoldSlice.js

import { createSlice } from '@reduxjs/toolkit';

import { setRoom } from '../room/roomSlice';

// Mirrored from server/constants/roomConstants.js — same convention
// auctionSlice.js's identical cross-slice reset already established.
const ROOM_STATUS_LOBBY = 'lobby';

const initialState = {
  isRoundActive: false,
  // Full player documents for this room's unsold pool — populated only if
  // UNSOLD_EVENTS.ROUND_STARTED actually carries them. See this file's
  // explanation: that depends on a still-pending fix to
  // unsoldRoundManager.js. Defaults to empty and degrades gracefully
  // (an empty grid, not a crash) until that's resolved.
  unsoldPlayers: [],
  unsoldPlayerCount: 0,
  durationSeconds: null,
  mySelectedPlayerIds: [],
  submissionStatus: 'idle', // 'idle' | 'submitted'
  submittedAt: null,
  miniAuctionPoolSize: null,
};

const unsoldSlice = createSlice({
  name: 'unsold',
  initialState,
  reducers: {
    applyRoundStarted: (state, action) => {
      state.isRoundActive = true;
      state.unsoldPlayerCount = action.payload.unsoldPlayerCount;
      state.durationSeconds = action.payload.durationSeconds;
      state.unsoldPlayers = action.payload.unsoldPlayers || [];
      state.mySelectedPlayerIds = [];
      state.submissionStatus = 'idle';
      state.submittedAt = null;
      state.miniAuctionPoolSize = null;
    },
    applyRoundEnded: (state, action) => {
      state.isRoundActive = false;
      state.miniAuctionPoolSize = action.payload.miniAuctionPoolSize;
    },
    togglePlayerSelection: (state, action) => {
      const playerId = action.payload;
      const index = state.mySelectedPlayerIds.indexOf(playerId);

      if (index === -1) {
        state.mySelectedPlayerIds.push(playerId);
      } else {
        state.mySelectedPlayerIds.splice(index, 1);
      }
    },
    applySelectionConfirmed: (state, action) => {
      state.submissionStatus = 'submitted';
      state.submittedAt = action.payload.submittedAt;
      // Syncs to the server's canonical, de-duplicated list — the server
      // remains the source of truth even for this team's own picks.
      state.mySelectedPlayerIds = action.payload.selectedPlayerIds;
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
  applyRoundStarted,
  applyRoundEnded,
  togglePlayerSelection,
  applySelectionConfirmed,
} = unsoldSlice.actions;
export default unsoldSlice.reducer;