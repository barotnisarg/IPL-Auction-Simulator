// client/src/components/lobby/RoomCodeDisplay.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

const CopyIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RoomCodeDisplay = () => {
  const { room } = useSelector((state) => state.room);
  const [copyState, setCopyState] = useState('idle');

  const handleCopy = async () => {
    if (!room?.roomCode) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  };

  if (!room) return null;

  const copied  = copyState === 'copied';
  const failed  = copyState === 'failed';

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Room code
      </p>

      {/* The code itself — big mono, widely spaced, amber */}
      <p className="mt-2 nums font-mono text-5xl font-black tracking-[0.35em] text-amber-400">
        {room.roomCode}
      </p>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={[
          'mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition active:scale-95',
          copied
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : failed
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-700 hover:text-neutral-100',
        ].join(' ')}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied!' : failed ? 'Copy failed' : 'Copy code'}
      </button>

      <p className="mt-3 text-xs text-neutral-600">
        Share this with everyone who is joining the room.
      </p>
    </div>
  );
};

export default RoomCodeDisplay;