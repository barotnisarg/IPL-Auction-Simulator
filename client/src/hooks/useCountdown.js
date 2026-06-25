// client/src/hooks/useCountdown.js

import { useState, useEffect, useRef } from 'react';

const useCountdown = ({ durationSeconds, isActive = true, onExpire }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  // Holding the callback in a ref means a new inline arrow function passed
  // in on every parent render doesn't tear down and restart the interval —
  // only durationSeconds/isActive changing should ever do that.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSecondsRemaining((previous) => {
        if (previous <= 1) {
          clearInterval(intervalId);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, durationSeconds]);

  return {
    secondsRemaining,
    isExpired: secondsRemaining <= 0,
  };
};

export default useCountdown;