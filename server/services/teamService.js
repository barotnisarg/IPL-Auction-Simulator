// server/services/teamService.js

const Team = require('../models/Team');

const getTeamsByRoomId = async (roomId) => {
  const teams = await Team.find({ roomId })
    .sort({ createdAt: 1 })
    .populate('squad.playerId', 'name country imageUrl')
    .populate('userId', 'name');
  return teams;
};

const getTeamById = async (teamId) => {
  const team = await Team.findById(teamId)
    .populate('squad.playerId', 'name country imageUrl')
    .populate('userId', 'name');

  if (!team) {
    const error = new Error('Team not found.');
    error.statusCode = 404;
    throw error;
  }

  return team;
};

module.exports = {
  getTeamsByRoomId,
  getTeamById,
};