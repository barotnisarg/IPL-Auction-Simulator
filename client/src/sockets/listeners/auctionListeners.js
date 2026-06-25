// client/src/sockets/listeners/auctionListeners.js

import { AUCTION_EVENTS } from '../socketEvents';
import {
  applyStateUpdate,
  applyTimerTick,
  recordPlayerSold,
  recordPlayerUnsold,
} from '../../features/auction/auctionSlice';

const registerAuctionListeners = (socket, dispatch) => {
  const handleStateUpdate = (payload) => {
    dispatch(applyStateUpdate(payload));
  };

  const handleTimerTick = (payload) => {
    dispatch(applyTimerTick(payload));
  };

  const handlePlayerSold = (payload) => {
    dispatch(recordPlayerSold(payload));
  };

  const handlePlayerUnsold = (payload) => {
    dispatch(recordPlayerUnsold(payload));
  };

  const handleAuctionError = ({ message } = {}) => {
    // Same flagged gap as roomListeners.js's handleRoomError: no toast/
    // notification system exists yet, so this is console-only for now.
    console.error('Auction socket error:', message);
  };

  socket.on(AUCTION_EVENTS.STATE_UPDATE, handleStateUpdate);
  socket.on(AUCTION_EVENTS.TIMER_TICK, handleTimerTick);
  socket.on(AUCTION_EVENTS.PLAYER_SOLD, handlePlayerSold);
  socket.on(AUCTION_EVENTS.PLAYER_UNSOLD, handlePlayerUnsold);
  socket.on(AUCTION_EVENTS.ERROR, handleAuctionError);

  return () => {
    socket.off(AUCTION_EVENTS.STATE_UPDATE, handleStateUpdate);
    socket.off(AUCTION_EVENTS.TIMER_TICK, handleTimerTick);
    socket.off(AUCTION_EVENTS.PLAYER_SOLD, handlePlayerSold);
    socket.off(AUCTION_EVENTS.PLAYER_UNSOLD, handlePlayerUnsold);
    socket.off(AUCTION_EVENTS.ERROR, handleAuctionError);
  };
};

export default registerAuctionListeners;