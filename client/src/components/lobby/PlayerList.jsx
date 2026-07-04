// client/src/components/lobby/PlayerList.jsx

import { useSelector } from 'react-redux';

const MAX_PLAYERS_PER_ROOM = 5;

const CrownIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5 16l-2-9 6 4 3-6 3 6 6-4-2 9H5zm0 2h14v2H5v-2z" />
  </svg>
);

const PlayerList = () => {
  const { teams }          = useSelector((state) => state.team);
  const { room }           = useSelector((state) => state.room);
  const { user }           = useSelector((state) => state.auth);
  const emptySlots         = Math.max(0, MAX_PLAYERS_PER_ROOM - teams.length);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-100">Franchises</h2>
        <span className="rounded-md bg-neutral-800 px-2.5 py-0.5 font-mono text-xs font-bold text-neutral-400">
          {teams.length}/{MAX_PLAYERS_PER_ROOM}
        </span>
      </div>

      {/* Team rows */}
      <ul className="mt-3 space-y-1.5">
        {teams.map((team) => {
          const isHost = Boolean(room) && team.userId._id === room.hostUserId;
          const isMe   = Boolean(user) && team.userId._id === user._id;

          return (
            <li
              key={team._id}
              className={[
                'flex items-center justify-between rounded-lg px-3.5 py-2.5',
                isMe
                  ? 'border border-amber-500/20 bg-amber-500/5'
                  : 'border border-neutral-800 bg-neutral-950',
              ].join(' ')}
            >
              <div className="flex items-center gap-2.5">
                {/* Initials avatar */}
                <span className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black',
                  isMe ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-500',
                ].join(' ')}>
                  {team.teamName.charAt(0).toUpperCase()}
                </span>

                <span className="text-sm font-semibold text-neutral-100">
                  {team.teamName}
                </span>

                {isMe && (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-500">
                    You
                  </span>
                )}
              </div>

              {isHost && (
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <CrownIcon />
                  Host
                </span>
              )}
            </li>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center gap-2.5 rounded-lg border border-dashed border-neutral-800 px-3.5 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-700" />
            </span>
            <span className="text-sm text-neutral-700">Waiting for a franchise...</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;