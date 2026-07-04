// client/src/components/common/Countdown.jsx

import useCountdown from '../../hooks/useCountdown';

const RING_SIZE  = { sm: 52, md: 80, lg: 120 };
const TEXT_CLASS = { sm: 'text-base', md: 'text-2xl', lg: 'text-4xl' };
const STROKE     = 5;
const URGENT_AT  = 3;

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const Countdown = ({
  totalSeconds,
  secondsRemaining: controlled,
  isActive = true,
  onExpire,
  variant = 'ring',
  label,
  size = 'md',
}) => {
  const isControlled = controlled !== undefined && controlled !== null;

  // Always called regardless of mode — hooks must not be conditional.
  const local = useCountdown({
    durationSeconds: totalSeconds,
    isActive: isActive && !isControlled,
    onExpire,
  });

  const secs   = Math.max(0, (isControlled ? controlled : local.secondsRemaining) ?? 0);
  const urgent = secs > 0 && secs <= URGENT_AT;

  // Amber normally, red when urgent — matches the existing palette exactly.
  const numColor  = urgent ? 'text-red-400'   : 'text-amber-400';
  const arcColor  = urgent ? 'text-red-400'   : 'text-amber-400';
  const trackColor = urgent ? 'text-red-900/30' : 'text-neutral-800';

  if (variant === 'text') {
    return (
      <div className="flex flex-col items-center">
        <p className={`font-mono font-bold nums leading-none ${TEXT_CLASS[size]} ${numColor}`}>
          {totalSeconds > 60 ? fmt(secs) : secs}
        </p>
        {label && (
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-neutral-500">
            {label}
          </p>
        )}
      </div>
    );
  }

  // Ring variant
  const d   = RING_SIZE[size];
  const r   = (d - STROKE) / 2;
  const c   = 2 * Math.PI * r;
  const pct = totalSeconds > 0 ? secs / totalSeconds : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: d, height: d }}>
        <svg width={d} height={d} className="-rotate-90" aria-hidden="true">
          {/* Background track */}
          <circle
            cx={d / 2} cy={d / 2} r={r}
            fill="none" stroke="currentColor"
            strokeWidth={STROKE}
            className={trackColor}
          />
          {/* Progress arc */}
          <circle
            cx={d / 2} cy={d / 2} r={r}
            fill="none" stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className={`transition-all duration-500 ease-linear ${arcColor}`}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold nums ${TEXT_CLASS[size]} ${numColor}`}
        >
          {secs}
        </span>
      </div>
      {label && (
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
          {label}
        </p>
      )}
    </div>
  );
};

export default Countdown;