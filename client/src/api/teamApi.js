// client/src/api/teamApi.js

import axiosInstance from './axiosInstance';

export const getTeamsByRoom = async (roomId) => {
  const response = await axiosInstance.get(`/teams/room/${roomId}`);
  return response.data;
};

export const getTeam = async (teamId) => {
  const response = await axiosInstance.get(`/teams/${teamId}`);
  return response.data;
};