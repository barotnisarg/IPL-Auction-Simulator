// client/src/sockets/listeners/unsoldListeners.js

import { UNSOLD_EVENTS } from '../socketEvents';
import {
  applyRoundStarted,
  applyRoundEnded,
  applySelectionConfirmed,
} from '../../features/unsold/unsoldSlice';

const registerUnsoldListeners = (socket, dispatch) => {
  const handleRoundStarted = (payload) => {
    dispatch(applyRoundStarted(payload));
  };

  const handleRoundEnded = (payload) => {
    dispatch(applyRoundEnded(payload));
  };

  const handleSelectionConfirmed = (payload) => {
    dispatch(applySelectionConfirmed(payload));
  };

  const handleUnsoldError = ({ message } = {}) => {
    // Same flagged gap as roomListeners.js/auctionListeners.js — no toast/
    // notification system exists yet, so this is console-only for now.
    console.error('Unsold round socket error:', message);
  };

  socket.on(UNSOLD_EVENTS.ROUND_STARTED, handleRoundStarted);
  socket.on(UNSOLD_EVENTS.ROUND_ENDED, handleRoundEnded);
  socket.on(UNSOLD_EVENTS.SELECTION_CONFIRMED, handleSelectionConfirmed);
  socket.on(UNSOLD_EVENTS.ERROR, handleUnsoldError);

  return () => {
    socket.off(UNSOLD_EVENTS.ROUND_STARTED, handleRoundStarted);
    socket.off(UNSOLD_EVENTS.ROUND_ENDED, handleRoundEnded);
    socket.off(UNSOLD_EVENTS.SELECTION_CONFIRMED, handleSelectionConfirmed);
    socket.off(UNSOLD_EVENTS.ERROR, handleUnsoldError);
  };
};

export default registerUnsoldListeners;