// client/src/app/store.js

import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import roomReducer from '../features/room/roomSlice';
import auctionReducer from '../features/auction/auctionSlice';
import teamReducer from '../features/team/teamSlice';
import unsoldReducer from '../features/unsold/unsoldSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    room: roomReducer,
    auction: auctionReducer,
    team: teamReducer,
    unsold: unsoldReducer,
  },
});

export default store;