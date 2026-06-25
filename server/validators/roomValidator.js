// server/validators/roomValidator.js

const { ROOM_CODE_LENGTH, ROOM_CODE_CHARSET } = require('../constants/roomConstants');

const ROOM_CODE_REGEX = new RegExp(`^[${ROOM_CODE_CHARSET}]{${ROOM_CODE_LENGTH}}$`);

const validateTeamName = (teamName, errors) => {
  if (!teamName || !teamName.trim()) {
    errors.push('Team name is required.');
  } else if (teamName.trim().length < 2 || teamName.trim().length > 40) {
    errors.push('Team name must be between 2 and 40 characters.');
  }
};

const validateCreateRoomInput = ({ teamName }) => {
  const errors = [];

  validateTeamName(teamName, errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateJoinRoomInput = ({ roomCode, teamName }) => {
  const errors = [];

  if (!roomCode || !roomCode.trim()) {
    errors.push('Room code is required.');
  } else if (!ROOM_CODE_REGEX.test(roomCode.trim().toUpperCase())) {
    errors.push('Invalid room code format.');
  }

  validateTeamName(teamName, errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCreateRoomInput,
  validateJoinRoomInput,
};