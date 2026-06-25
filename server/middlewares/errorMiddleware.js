// server/middlewares/errorMiddleware.js

const { sendError } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack || err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server.';
  let errors = null;

  // Mongoose: invalid ObjectId passed in a route param/query
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field "${err.path}".`;
  }

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((fieldError) => fieldError.message);
  }

  // Mongoose: duplicate key on a unique field
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = duplicateField
      ? `${duplicateField} already exists.`
      : 'Duplicate field value entered.';
  }

  // JWT errors (fallback safety net — authMiddleware.js handles these directly too)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorMiddleware;