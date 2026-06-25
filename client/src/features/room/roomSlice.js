// client/src/features/room/roomSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  createRoom as createRoomRequest,
  joinRoom as joinRoomRequest,
  getRoomByCode,
} from '../../api/roomApi';

const initialState = {
  room: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const createRoom = createAsyncThunk(
  'room/createRoom',
  async ({ teamName }, { rejectWithValue }) => {
    try {
      return await createRoomRequest({ teamName });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room.');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'room/joinRoom',
  async ({ roomCode, teamName }, { rejectWithValue }) => {
    try {
      return await joinRoomRequest({ roomCode, teamName });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room.');
    }
  }
);

export const fetchRoomByCode = createAsyncThunk(
  'room/fetchRoomByCode',
  async (roomCode, { rejectWithValue }) => {
    try {
      return await getRoomByCode(roomCode);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room.');
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (state, action) => {
      state.room = action.payload;
    },
    clearRoom: (state) => {
      state.room = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoom.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.room = action.payload.data.room;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(joinRoom.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.room = action.payload.data.room;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchRoomByCode.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRoomByCode.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.room = action.payload.data.room;
      })
      .addCase(fetchRoomByCode.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setRoom, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;