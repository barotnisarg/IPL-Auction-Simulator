// server/services/auctionEngine/timerManager.js

const startCountdown = ({ durationSeconds, onTick, onExpire }) => {
  let secondsRemaining = durationSeconds;
  let intervalId = null;
  let expired = false;

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
      if (!expired && onExpire) {
        expired = true;
        onExpire();
      }
      return;
    }

    if (onTick) {
      onTick(secondsRemaining);
    }
  };

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