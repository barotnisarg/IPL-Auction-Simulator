// client/src/features/auth/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPasswordApi,
  resetPasswordApi,
} from '../../api/authApi';

const TOKEN_STORAGE_KEY = 'authToken';

const initialState = {
  user:            null,
  token:           localStorage.getItem(TOKEN_STORAGE_KEY) || null,
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  status:          'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error:           null,

  // Separate status fields for the two new flows so their loading/error
  // states don't stomp on each other or on the main login/register flow.
  forgotStatus:  'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  forgotError:   null,
  resetStatus:   'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  resetError:    null,
};

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      return await registerUser({ name, email, password });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed.');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await loginUser({ email, password });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentUser();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current user.');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      return await forgotPasswordApi({ email });
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send reset email.'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      return await resetPasswordApi({ token, password, confirmPassword });
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reset password.'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      state.status          = 'idle';
      state.error           = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    },
    clearForgotStatus: (state) => {
      state.forgotStatus = 'idle';
      state.forgotError  = null;
    },
    clearResetStatus: (state) => {
      state.resetStatus = 'idle';
      state.resetError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── register ──────────────────────────────────────────────────────
      .addCase(register.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.status          = 'succeeded';
        state.user            = action.payload.data.user;
        state.token           = action.payload.data.token;
        state.isAuthenticated = true;
        localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.data.token);
      })
      .addCase(register.rejected,  (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // ── login ─────────────────────────────────────────────────────────
      .addCase(login.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status          = 'succeeded';
        state.user            = action.payload.data.user;
        state.token           = action.payload.data.token;
        state.isAuthenticated = true;
        localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.data.token);
      })
      .addCase(login.rejected,  (state, action) => { state.status = 'failed'; state.error = action.payload; })

      // ── fetchCurrentUser ──────────────────────────────────────────────
      .addCase(fetchCurrentUser.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status          = 'succeeded';
        state.user            = action.payload.data.user;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected,  (state, action) => {
        state.status          = 'failed';
        state.error           = action.payload;
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
      })

      // ── forgotPassword ────────────────────────────────────────────────
      .addCase(forgotPassword.pending,   (state) => { state.forgotStatus = 'loading'; state.forgotError = null; })
      .addCase(forgotPassword.fulfilled, (state) => { state.forgotStatus = 'succeeded'; })
      .addCase(forgotPassword.rejected,  (state, action) => {
        state.forgotStatus = 'failed';
        state.forgotError  = action.payload;
      })

      // ── resetPassword ─────────────────────────────────────────────────
      .addCase(resetPassword.pending,   (state) => { state.resetStatus = 'loading'; state.resetError = null; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetStatus     = 'succeeded';
        state.user            = action.payload.data.user;
        state.token           = action.payload.data.token;
        state.isAuthenticated = true;
        localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.data.token);
      })
      .addCase(resetPassword.rejected,  (state, action) => {
        state.resetStatus = 'failed';
        state.resetError  = action.payload;
      });
  },
});

export const { logout, clearForgotStatus, clearResetStatus } = authSlice.actions;
export default authSlice.reducer;