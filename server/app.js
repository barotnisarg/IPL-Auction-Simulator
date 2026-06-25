// server/app.js

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const teamRoutes = require('./routes/teamRoutes');

const errorMiddleware = require('./middlewares/errorMiddleware');
const { sendError } = require('./utils/apiResponse');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'IPL Auction Simulator API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/teams', teamRoutes);

// Catch-all for any route that didn't match above
app.use((req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found.`);
});

// Centralized error handler — must be the last middleware registered
app.use(errorMiddleware);

module.exports = app;