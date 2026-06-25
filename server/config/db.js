// server/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB connection failed: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB runtime error: ${error.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

module.exports = connectDB;