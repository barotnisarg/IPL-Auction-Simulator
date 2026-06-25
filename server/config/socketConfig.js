// server/config/socketConfig.js

const getSocketConfig = () => ({
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

module.exports = getSocketConfig;