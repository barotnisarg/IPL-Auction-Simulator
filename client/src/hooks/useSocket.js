// client/src/hooks/useSocket.js

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../sockets/socket';
import registerRoomListeners from '../sockets/listeners/roomListeners';
import registerAuctionListeners from '../sockets/listeners/auctionListeners';
import registerUnsoldListeners from '../sockets/listeners/unsoldListeners';

// Module-level, not a useRef inside the hook. This hook is called from many
// components at once on the same screen (HostControls.jsx and LobbyPage.jsx
// both use it while the Lobby is mounted). A per-component ref would make
// each mounted component think it's the one responsible for registering
// listeners, stacking duplicate room/auction/unsold listeners — exactly the
// bug registerRoomListeners' own cleanup function exists to prevent.
// Tracking this once, at module scope, keeps registration genuinely singular
// no matter how many components call this hook simultaneously.
let domainListenersCleanup = null;

const useSocket = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Local connection-status tracking — legitimately per-component-instance,
  // unlike the domain listeners below. Each consumer just wants to know
  // "is the shared socket connected right now," and removing only this
  // component's own connect/disconnect listener on unmount is correct.
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // App-wide connection + listener lifecycle, driven by auth state, not by
  // any single component's mount/unmount.
  useEffect(() => {
    if (!isAuthenticated) {
      if (domainListenersCleanup) {
        domainListenersCleanup();
        domainListenersCleanup = null;
      }
      socket.disconnect();
      return undefined;
    }

    socket.connect();

    if (!domainListenersCleanup) {
      const cleanupRoom = registerRoomListeners(socket, dispatch);
      const cleanupAuction = registerAuctionListeners(socket, dispatch);
      const cleanupUnsold = registerUnsoldListeners(socket, dispatch);

      domainListenersCleanup = () => {
        cleanupRoom();
        cleanupAuction();
        cleanupUnsold();
      };
    }

    return undefined;
  }, [isAuthenticated, dispatch]);

  return { socket, isConnected };
};

export default useSocket;