// server/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');

const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Not authorized. No token provided.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);

  if (!user) {
    const error = new Error('Not authorized. User no longer exists.');
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;