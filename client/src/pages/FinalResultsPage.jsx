// client/src/pages/FinalResultsPage.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import Loader from '../components/common/Loader';
import FinalTeamCard from '../components/results/FinalTeamCard';

const ROOM_STATUS_LOBBY          = 'lobby';
const ROOM_STATUS_UNSOLD_SELECTION = 'unsold-selection';
const ROOM_STATUS_COMPLETED      = 'completed';
const ACTIVE_BIDDING_STATUSES    = ['marquee', 'pool1', 'pool2', 'mini-auction'];

const redirectForStatus = (status, roomCode) => {
  if (status === ROOM_STATUS_LOBBY)           return `/lobby/${roomCode}`;
  if (status === ROOM_STATUS_UNSOLD_SELECTION) return `/unsold-selection/${roomCode}`;
  if (ACTIVE_BIDDING_STATUSES.includes(status)) return `/auction/${roomCode}`;
  return null;
};

// Find which team spent the most — they get a champion highlight on their card.
const findChampionTeamId = (teams) => {
  if (!teams.length) return null;
  return teams.reduce((best, team) => {
    const spent = team.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
    const bestSpent = best.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
    return spent > bestSpent ? team : best;
  }, teams[0])?._id?.toString() ?? null;
};

const FinalResultsPage = () => {
  const { roomCode } = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();

  const { room, status: roomStatus } = useSelector((state) => state.room);
  const { teams }                    = useSelector((state) => state.team);

  useEffect(() => { dispatch(fetchRoomByCode(roomCode)); }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) dispatch(fetchTeamsByRoom(room._id));
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (!room) return;
    const redirectTo = redirectForStatus(room.status, room.roomCode);
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading results..." />;
  }

  if (roomStatus === 'failed' && !room) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-base font-bold text-neutral-100">Room not found.</p>
        <p className="text-sm text-neutral-500">
          Double check the link, or ask your host to share the room code again.
        </p>
      </div>
    );
  }

  if (!room || room.status !== ROOM_STATUS_COMPLETED) return null;

  const championId = findChampionTeamId(teams);

  return (
    <div className="min-h-dvh bg-neutral-950">
      {/* Top bar */}
      <header className="border-b border-neutral-900 px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
            Cric<span className="text-amber-400">Bid</span>
          </Link>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            Auction complete
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero heading */}
        <div className="text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-600">
            Final Results · {room.roomCode}
          </p>
          <h1 className="mt-3 text-3xl font-black text-neutral-100 md:text-4xl">
            The squads are set.
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Every franchise&apos;s final squad, spend, and remaining budget.
          </p>
        </div>

        {/* Summary strip */}
        {teams.length > 0 && (
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 divide-x divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            {[
              {
                label: 'Franchises',
                value: teams.length,
              },
              {
                label: 'Players sold',
                value: teams.reduce((s, t) => s + t.squad.length, 0),
              },
              {
                label: 'Total spent',
                value: (() => {
                  const lakhs = teams.reduce(
                    (s, t) => s + t.squad.reduce((ss, e) => ss + e.purchasePriceLakhs, 0),
                    0
                  );
                  return lakhs >= 100
                    ? `₹${(lakhs / 100).toFixed(1)} Cr`
                    : `₹${lakhs} L`;
                })(),
              },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-5 text-center">
                <p className="nums font-mono text-xl font-black text-neutral-100">{stat.value}</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-600">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Team cards grid */}
        {teams.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-neutral-600">No teams found for this room.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {teams.map((team) => (
              <FinalTeamCard
                key={team._id}
                team={team}
                isChampion={team._id?.toString() === championId}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-800 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FinalResultsPage;