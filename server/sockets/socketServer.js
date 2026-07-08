// server/sockets/socketServer.js

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');

const getSocketConfig         = require('../config/socketConfig');
const User                    = require('../models/User');

const registerRoomHandlers     = require('./handlers/roomSocketHandlers');
const registerAuctionHandlers  = require('./handlers/auctionSocketHandlers');
const registerUnsoldHandlers   = require('./handlers/unsoldSocketHandlers');
const registerReactionHandlers = require('./handlers/reactionSocketHandlers');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Not authorized. No token provided.'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.userId);
    if (!user)    return next(new Error('Not authorized. User no longer exists.'));

    socket.user = user;
    return next();
  } catch {
    return next(new Error('Not authorized. Invalid or expired token.'));
  }
};

const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, getSocketConfig());

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerAuctionHandlers(io, socket);
    registerUnsoldHandlers(io, socket);
    registerReactionHandlers(io, socket);
  });

  return io;
};

module.exports = initializeSocketServer;