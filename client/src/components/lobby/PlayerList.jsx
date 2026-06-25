// client/src/components/lobby/PlayerList.jsx

import { useSelector } from 'react-redux';

const MAX_PLAYERS_PER_ROOM = 5;

const PlayerList = () => {
  const { teams } = useSelector((state) => state.team);
  const { room } = useSelector((state) => state.room);
  const { user } = useSelector((state) => state.auth);

  const emptySlotCount = Math.max(0, MAX_PLAYERS_PER_ROOM - teams.length);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Franchises
        </h2>
        <span className="text-sm text-neutral-500">
          {teams.length} / {MAX_PLAYERS_PER_ROOM}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {teams.map((team) => {
          const isHost = Boolean(room) && team.userId._id === room.hostUserId;
          const isMe = Boolean(user) && team.userId._id === user._id;

          return (
            <li
              key={team._id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-100">
                {team.teamName}
                {isMe && (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-400">
                    You
                  </span>
                )}
              </span>

              {isHost && (
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5 16l-2-9 6 4 3-6 3 6 6-4-2 9H5zm0 2h14v2H5v-2z" />
                  </svg>
                  Host
                </span>
              )}
            </li>
          );
        })}

        {Array.from({ length: emptySlotCount }).map((_, index) => (
          <li
            key={`empty-${index}`}
            className="rounded-lg border border-dashed border-neutral-800 px-4 py-3 text-sm text-neutral-600"
          >
            Waiting for a franchise to join...
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;