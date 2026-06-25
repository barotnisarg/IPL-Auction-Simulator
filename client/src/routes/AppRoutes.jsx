// client/src/routes/AppRoutes.jsx

import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/common/ProtectedRoute';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CreateRoomPage from '../pages/CreateRoomPage';
import JoinRoomPage from '../pages/JoinRoomPage';
import LobbyPage from '../pages/LobbyPage';
import AuctionPage from '../pages/AuctionPage';
import UnsoldSelectionPage from '../pages/UnsoldSelectionPage';
import FinalResultsPage from '../pages/FinalResultsPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/create-room" element={<CreateRoomPage />} />
        <Route path="/join-room" element={<JoinRoomPage />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/auction/:roomCode" element={<AuctionPage />} />
        <Route path="/unsold-selection/:roomCode" element={<UnsoldSelectionPage />} />
        <Route path="/results/:roomCode" element={<FinalResultsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;