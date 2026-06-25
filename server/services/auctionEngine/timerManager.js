// server/services/auctionEngine/timerManager.js

// Deliberately has no concept of rooms, players, or bids — every call
// creates its own fully independent countdown via closure (its own
// secondsRemaining, its own intervalId), so any number of rooms can each
// run their own timer concurrently with zero shared state to collide on.
const startCountdown = ({ durationSeconds, onTick, onExpire }) => {
  let secondsRemaining = durationSeconds;
  let intervalId = null;

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const tick = () => {
    secondsRemaining -= 1;

    if (secondsRemaining <= 0) {
      stop();
      if (onExpire) {
        onExpire();
      }
      return;
    }

    if (onTick) {
      onTick(secondsRemaining);
    }
  };

  // Fire once immediately at the full duration, so a freshly-broadcast
  // TIMER_TICK shows "7" (or "300") right away rather than the UI waiting
  // a full second to see any number at all.
  if (onTick) {
    onTick(secondsRemaining);
  }

  intervalId = setInterval(tick, 1000);

  return {
    stop,
    getSecondsRemaining: () => secondsRemaining,
  };
};

module.exports = { startCountdown };