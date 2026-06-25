// client/src/components/common/Countdown.jsx

import useCountdown from '../../hooks/useCountdown';

const RING_SIZE_PX = { sm: 56, md: 88, lg: 128 };
const TEXT_SIZE_STYLES = { sm: 'text-lg', md: 'text-3xl', lg: 'text-5xl' };
const STROKE_WIDTH = 6;
const URGENT_THRESHOLD_SECONDS = 3;

const formatAsClock = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const Countdown = ({
  totalSeconds,
  secondsRemaining: controlledSecondsRemaining,
  isActive = true,
  onExpire,
  variant = 'ring', // 'ring' | 'text'
  label,
  size = 'md',
}) => {
  const isControlled =
    controlledSecondsRemaining !== undefined && controlledSecondsRemaining !== null;

  // Always called, never conditionally — required by React's rules of
  // hooks. In controlled mode, isActive is forced false here, so the hook
  // never starts its own interval and its output is simply never read
  // below. onExpire is therefore only ever actually invoked in uncontrolled
  // mode — the controlled (server-authoritative) timer never lets this
  // component decide its own expiry.
  const localCountdown = useCountdown({
    durationSeconds: totalSeconds,
    isActive: isActive && !isControlled,
    onExpire,
  });

  const secondsRemaining = isControlled ? controlledSecondsRemaining : localCountdown.secondsRemaining;
  const clampedSeconds = Math.max(0, secondsRemaining ?? 0);
  const isUrgent = clampedSeconds > 0 && clampedSeconds <= URGENT_THRESHOLD_SECONDS;

  if (variant === 'text') {
    return (
      <div className="flex flex-col items-center">
        <p
          className={`font-mono font-black tabular-nums ${TEXT_SIZE_STYLES[size]} ${
            isUrgent ? 'text-red-400' : 'text-neutral-100'
          }`}
        >
          {totalSeconds > 60 ? formatAsClock(clampedSeconds) : clampedSeconds}
        </p>
        {label && (
          <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">{label}</p>
        )}
      </div>
    );
  }

  const diameter = RING_SIZE_PX[size];
  const radius = (diameter - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? clampedSeconds / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} className="-rotate-90">
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-neutral-800"
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`transition-all duration-300 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-mono font-black tabular-nums ${TEXT_SIZE_STYLES[size]} ${
            isUrgent ? 'text-red-400' : 'text-neutral-100'
          }`}
        >
          {clampedSeconds}
        </span>
      </div>
      {label && (
        <p className="mt-2 text-xs uppercase tracking-widest text-neutral-500">{label}</p>
      )}
    </div>
  );
};

export default Countdown;