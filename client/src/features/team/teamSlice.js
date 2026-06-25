// client/src/features/team/teamSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { getTeamsByRoom, getTeam } from '../../api/teamApi';
import { createRoom, joinRoom } from '../room/roomSlice';

const initialState = {
  teams: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchTeamsByRoom = createAsyncThunk(
  'team/fetchTeamsByRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      return await getTeamsByRoom(roomId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams.');
    }
  }
);

export const fetchTeamById = createAsyncThunk(
  'team/fetchTeamById',
  async (teamId, { rejectWithValue }) => {
    try {
      return await getTeam(teamId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team.');
    }
  }
);

const upsertTeam = (state, team) => {
  const existingIndex = state.teams.findIndex((existing) => existing._id === team._id);

  if (existingIndex === -1) {
    state.teams.push(team);
  } else {
    state.teams[existingIndex] = team;
  }
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeams: (state, action) => {
      state.teams = action.payload;
    },
    upsertTeamFromSocket: (state, action) => {
      upsertTeam(state, action.payload);
    },
    clearTeams: (state) => {
      state.teams = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamsByRoom.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTeamsByRoom.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = action.payload.data.teams;
      })
      .addCase(fetchTeamsByRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchTeamById.fulfilled, (state, action) => {
        upsertTeam(state, action.payload.data.team);
      })
      // Cross-slice reaction: creating or joining a room also creates this
      // user's team in the same request. Reacting to roomSlice's own actions
      // here means that team is already in state immediately — no second
      // fetch is needed right after either action resolves.
      .addCase(createRoom.fulfilled, (state, action) => {
        state.teams = [action.payload.data.team];
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        upsertTeam(state, action.payload.data.team);
      });
  },
});

export const { setTeams, upsertTeamFromSocket, clearTeams } = teamSlice.actions;
export default teamSlice.reducer;