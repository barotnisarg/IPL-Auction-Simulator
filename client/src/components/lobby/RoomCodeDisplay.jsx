// client/src/components/lobby/RoomCodeDisplay.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';

const RoomCodeDisplay = () => {
  const { room } = useSelector((state) => state.room);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'

  const handleCopy = async () => {
    if (!room?.roomCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    setTimeout(() => setCopyState('idle'), 2000);
  };

  if (!room) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
        Room Code
      </p>

      <p className="mt-2 font-mono text-4xl font-black tracking-[0.3em] text-amber-400">
        {room.roomCode}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy code'}
      </button>

      <p className="mt-3 text-xs text-neutral-500">
        Share this code so others can join your room.
      </p>
    </div>
  );
};

export default RoomCodeDisplay;