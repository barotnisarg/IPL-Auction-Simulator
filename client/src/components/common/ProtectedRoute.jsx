// client/src/components/common/ProtectedRoute.jsx

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

import { fetchCurrentUser } from '../../features/auth/authSlice';
import Loader from './Loader';

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { token, user, isAuthenticated, status } = useSelector((state) => state.auth);

  const isVerifyingSession = Boolean(token) && !user && status !== 'failed';

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isVerifyingSession) {
    return <Loader fullScreen label="Verifying your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;