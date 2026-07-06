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
        // Brand-new pool/set — full reset of both the player roster AND
        // the outcome map. Keeping the old pool's playerOutcomeMap entries
        // alive across a pool transition meant stale isCurrentlyAuctioning
        // markers from the last player of Pool 1 could survive into Pool 2
        // if a race between the reset emit and the first-player emit left
        // an orphaned entry in the map. Clearing it here is safe because
        // the new pool's players have not been resolved yet by definition.
        state.activeCategoryPlayers = {
          category,
          roleSubPhase,
          players: incomingPlayers,
        };
        // Clear the outcome map so no Pool 1 player's sold/unsold entry
        // can leak into the Pool 2 panel via the merge path.
        state.playerOutcomeMap = {};
        return;
      }

      // Same category — MERGE into existing roster instead of replacing.
      // The server sends only pending players + the live one; players who
      // already finished are not re-sent (they were shifted out of the
      // server's internal queue). A wholesale replace would drop every
      // already-resolved player from the panel the instant the next
      // player's update arrives.
      const existingById = new Map(
        (state.activeCategoryPlayers?.players ?? []).map((p) => [
          p._id?.toString(),
          p,
        ])
      );

      for (const incoming of incomingPlayers) {
        existingById.set(incoming._id?.toString(), incoming);
      }

      // Only the player explicitly marked live in this batch should carry
      // the isCurrentlyAuctioning flag — clear it on everyone else so the
      // previous player's Live badge doesn't persist after they resolve.
      const incomingLiveId = incomingPlayers
        .find((p) => p.isCurrentlyAuctioning)
        ?._id?.toString();

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