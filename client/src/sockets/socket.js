// client/src/sockets/socket.js

import { io } from 'socket.io-client';

const TOKEN_STORAGE_KEY = 'authToken'; // matches axiosInstance.js and authSlice.js

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  auth: (callback) => {
    callback({ token: localStorage.getItem(TOKEN_STORAGE_KEY) });
  },
});

export default socket;