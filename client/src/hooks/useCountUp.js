// client/src/hooks/useCountUp.js

import { useEffect, useRef, useState } from 'react';

// Ease-out-quart — starts fast, settles gently. Reads as "landing" on the
// final number rather than ticking to a mechanical stop.
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

// Animates a number from `from` to `to` over `durationMs`, driven by
// requestAnimationFrame rather than setInterval so it stays smooth even
// under load and automatically adapts to the browser's actual frame rate.
//
// Re-triggers automatically whenever `to` changes — this is the intended
// usage for a bid amount that keeps increasing, or a price revealed once
// when a player sells.
const useCountUp = ({ from = 0, to, durationMs = 700, isActive = true }) => {
  const [value, setValue] = useState(from);

  const rafRef       = useRef(null);
  const startTimeRef = useRef(null);
  const fromRef      = useRef(from);

  useEffect(() => {
    if (!isActive || to === null || to === undefined) {
      setValue(to ?? from);
      return undefined;
    }

    // Animate from wherever we currently sit, not from the original `from` —
    // so if `to` changes again mid-animation (rapid consecutive bids), the
    // count-up continues smoothly from its current position instead of
    // snapping back and restarting from zero every time.
    fromRef.current  = value;
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutQuart(progress);

      const next = fromRef.current + (to - fromRef.current) * eased;
      setValue(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(to);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, durationMs, isActive]);

  return value;
};

export default useCountUp;