// server/services/roomService.js

const Room = require('../models/Room');
const Team = require('../models/Team');

const { ROOM_STATUS, MAX_PLAYERS_PER_ROOM } = require('../constants/roomConstants');
const generateUniqueRoomCode = require('../utils/generateRoomCode');

const createRoom = async ({ hostUserId, teamName }) => {
  const roomCode = await generateUniqueRoomCode();

  const room = await Room.create({
    roomCode,
    hostUserId,
    status: ROOM_STATUS.LOBBY,
  });

  const team = await Team.create({
    roomId: room._id,
    userId: hostUserId,
    teamName,
  });

  return { room, team };
};

const getRoomByCode = async (roomCode) => {
  const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

  if (!room) {
    const error = new Error('Room not found.');
    error.statusCode = 404;
    throw error;
  }

  return room;
};

const joinRoom = async ({ roomCode, userId, teamName }) => {
  const room = await getRoomByCode(roomCode);

  if (room.status !== ROOM_STATUS.LOBBY) {
    const error = new Error(
      'This room has already started its auction and can no longer be joined.'
    );
    error.statusCode = 409;
    throw error;
  }

  const existingTeam = await Team.findOne({ roomId: room._id, userId });

  if (existingTeam) {
    const error = new Error('You have already joined this room.');
    error.statusCode = 409;
    throw error;
  }

  const teamCount = await Team.countDocuments({ roomId: room._id });

  if (teamCount >= MAX_PLAYERS_PER_ROOM) {
    const error = new Error(`This room is full (maximum ${MAX_PLAYERS_PER_ROOM} teams).`);
    error.statusCode = 409;
    throw error;
  }

  const team = await Team.create({
    roomId: room._id,
    userId,
    teamName,
  });

  return { room, team };
};

module.exports = {
  createRoom,
  getRoomByCode,
  joinRoom,
};