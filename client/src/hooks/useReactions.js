// client/src/hooks/useReactions.js

import { useCallback, useEffect, useRef, useState } from 'react';

import useSocket from './useSocket';
import { REACTION_EVENTS } from '../sockets/socketEvents';

// How long a reaction stays visible before being removed from the list.
// Must be slightly longer than the float-up animation duration (2200ms)
// so the element doesn't vanish mid-animation.
const REACTION_TTL_MS = 2400;

// Hard cap on simultaneous floating reactions — prevents a spam scenario
// where 5 users fire at the 2s cooldown minimum and the overlay fills up.
const MAX_VISIBLE = 12;

// useReactions — subscribes to the RECEIVED socket event and maintains a
// self-cleaning queue of active reactions. Each entry auto-expires after
// REACTION_TTL_MS via its own setTimeout, keyed by the server-assigned id
// so concurrent removals never collide.
const useReactions = () => {
  const { socket } = useSocket();
  const [reactions, setReactions] = useState([]);

  // Store timeout ids so we can clear them if the component unmounts
  // mid-flight — avoids setState-on-unmounted-component warnings.
  const timeoutsRef = useRef(new Map());

  const addReaction = useCallback((reaction) => {
    setReactions((prev) => {
      // Drop oldest reactions if we're over the cap.
      const trimmed = prev.length >= MAX_VISIBLE ? prev.slice(1) : prev;
      return [...trimmed, reaction];
    });

    // Schedule removal.
    const tid = setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      timeoutsRef.current.delete(reaction.id);
    }, REACTION_TTL_MS);

    timeoutsRef.current.set(reaction.id, tid);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleReceived = (payload) => {
      // Attach randomized display properties here (not on the server) so
      // each client independently randomizes the visual without the server
      // needing to know anything about rendering.
      addReaction({
        ...payload,
        driftX:      `${(Math.random() - 0.5) * 60}px`,
        durationMs:  2000 + Math.random() * 400,
        startX:      Math.random() * 80 + 10, // % from left edge
      });
    };

    socket.on(REACTION_EVENTS.RECEIVED, handleReceived);
    return () => socket.off(REACTION_EVENTS.RECEIVED, handleReceived);
  }, [socket, addReaction]);

  // Clear all pending timeouts on unmount.
  useEffect(() => {
    const tmap = timeoutsRef.current;
    return () => tmap.forEach((tid) => clearTimeout(tid));
  }, []);

  // emitReaction — called by EmojiReactionBar when a user taps a button.
  const emitReaction = useCallback(
    (emoji, roomCode) => {
      if (!socket || !roomCode) return;
      socket.emit(REACTION_EVENTS.SEND, { emoji, roomCode });
    },
    [socket]
  );

  return { reactions, emitReaction };
};

export default useReactions;