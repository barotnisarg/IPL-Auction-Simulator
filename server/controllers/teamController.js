// server/controllers/teamController.js

const teamService = require('../services/teamService');
const { sendSuccess } = require('../utils/apiResponse');

const getTeamsByRoom = async (req, res) => {
  const { roomId } = req.params;
  const teams = await teamService.getTeamsByRoomId(roomId);

  return sendSuccess(res, 200, 'Teams fetched successfully.', { teams });
};

const getTeam = async (req, res) => {
  const { teamId } = req.params;
  const team = await teamService.getTeamById(teamId);

  return sendSuccess(res, 200, 'Team fetched successfully.', { team });
};

module.exports = {
  getTeamsByRoom,
  getTeam,
};