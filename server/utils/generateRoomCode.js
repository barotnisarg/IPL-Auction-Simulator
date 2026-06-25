// server/utils/generateRoomCode.js

const { ROOM_CODE_LENGTH, ROOM_CODE_CHARSET } = require('../constants/roomConstants');
const Room = require('../models/Room');

const MAX_GENERATION_ATTEMPTS = 10;

const generateRandomCode = () => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARSET.length);
    code += ROOM_CODE_CHARSET[randomIndex];
  }
  return code;
};

const generateUniqueRoomCode = async () => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidateCode = generateRandomCode();
    const existingRoom = await Room.findOne({ roomCode: candidateCode });

    if (!existingRoom) {
      return candidateCode;
    }
  }

  throw new Error('Failed to generate a unique room code. Please try again.');
};

module.exports = generateUniqueRoomCode;