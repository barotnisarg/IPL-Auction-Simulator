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
  skippedTeamIds: [],
  currentPlayerBidLog: [],
  auctionHistory: [],
  lastResolvedPlayer: null,

  // Set when CATEGORY_STARTED fires. Persists for the entire category so
  // the "View List" panel can always be reopened. Never wiped mid-category.
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
      // Reset to [] when a new player loads (skippedTeamIds is empty in
      // that STATE_UPDATE); grows as teams skip the current player.
      state.skippedTeamIds = payload.skippedTeamIds ?? [];
    },

    applyTimerTick: (state, action) => {
      state.secondsRemaining = action.payload.secondsRemaining;
    },

    applyCategoryStarted: (state, action) => {
      const { category, roleSubPhase, players } = action.payload;
      const incomingPlayers = players ?? [];

      const isNewCategory = state.activeCategoryPlayers?.category !== category;

      if (isNewCategory) {
        // Brand-new pool/set — full reset. These are genuinely different
        // players from a different pool, so replacing is correct here.
        state.activeCategoryPlayers = {
          category,
          roleSubPhase,
          players: incomingPlayers,
        };
        return;
      }

      // Same category as before — MERGE instead of replace.
      // The server's per-player update only includes still-pending players
      // plus the one currently live; it does NOT re-send players who already
      // sold/went unsold earlier in this pool (they were already shifted out
      // of its internal queue). Replacing the list wholesale would silently
      // drop every already-resolved player from the panel the moment the
      // next player's update arrives — that was the "player disappears after
      // their auction finishes" bug. Merging by _id keeps everyone visible
      // for the entire pool; sold/unsold status comes separately from
      // playerOutcomeMap and is unaffected by this merge.
      const existingById = new Map(
        (state.activeCategoryPlayers?.players ?? []).map((p) => [p._id?.toString(), p])
      );

      for (const incoming of incomingPlayers) {
        existingById.set(incoming._id?.toString(), incoming);
      }

      // Only the player marked live in THIS incoming batch should stay
      // marked live — clear the flag on everyone else (e.g. the previous
      // player, now resolved, should lose their "Live" badge).
      const incomingLiveId = incomingPlayers
        .find((p) => p.isCurrentlyAuctioning)?._id?.toString();

      const mergedPlayers = Array.from(existingById.values())
        .map((p) => ({
          ...p,
          isCurrentlyAuctioning: p._id?.toString() === incomingLiveId,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      state.activeCategoryPlayers = {
        category,
        roleSubPhase: roleSubPhase ?? state.activeCategoryPlayers.roleSubPhase,
        players: mergedPlayers,
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