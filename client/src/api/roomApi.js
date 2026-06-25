// client/src/api/roomApi.js

import axiosInstance from './axiosInstance';

export const createRoom = async ({ teamName }) => {
  const response = await axiosInstance.post('/rooms', { teamName });
  return response.data;
};

export const joinRoom = async ({ roomCode, teamName }) => {
  const response = await axiosInstance.post('/rooms/join', { roomCode, teamName });
  return response.data;
};

export const getRoomByCode = async (roomCode) => {
  const response = await axiosInstance.get(`/rooms/${roomCode}`);
  return response.data;
};