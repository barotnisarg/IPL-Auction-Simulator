// server/controllers/roomController.js

const roomService = require('../services/roomService');
const { validateCreateRoomInput, validateJoinRoomInput } = require('../validators/roomValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createRoom = async (req, res) => {
  const { isValid, errors } = validateCreateRoomInput(req.body);

  if (!isValid) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  const { teamName } = req.body;
  const { room, team } = await roomService.createRoom({
    hostUserId: req.user._id,
    teamName,
  });

  return sendSuccess(res, 201, 'Room created successfully.', { room, team });
};

const joinRoom = async (req, res) => {
  const { isValid, errors } = validateJoinRoomInput(req.body);

  if (!isValid) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  const { roomCode, teamName } = req.body;
  const { room, team } = await roomService.joinRoom({
    roomCode,
    userId: req.user._id,
    teamName,
  });

  return sendSuccess(res, 200, 'Joined room successfully.', { room, team });
};

const getRoom = async (req, res) => {
  const { roomCode } = req.params;
  const room = await roomService.getRoomByCode(roomCode);

  return sendSuccess(res, 200, 'Room fetched successfully.', { room });
};

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
};