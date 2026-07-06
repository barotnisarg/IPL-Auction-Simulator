// client/src/pages/FinalResultsPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import { formatLakhsAsDisplay } from '../utils/formatCurrency';
import Loader from '../components/common/Loader';
import FinalTeamCard from '../components/results/FinalTeamCard';
import SoldImpactEffect from '../components/auction/SoldImpactEffect';
import useCountUp from '../hooks/useCountUp';

const ROOM_STATUS_LOBBY            = 'lobby';
const ROOM_STATUS_UNSOLD_SELECTION = 'unsold-selection';
const ROOM_STATUS_COMPLETED        = 'completed';
const ACTIVE_BIDDING_STATUSES      = ['marquee', 'pool1', 'pool2', 'mini-auction'];

const CHAMPION_CONFETTI_MS = 2600;

const redirectForStatus = (status, roomCode) => {
  if (status === ROOM_STATUS_LOBBY)            return `/lobby/${roomCode}`;
  if (status === ROOM_STATUS_UNSOLD_SELECTION) return `/unsold-selection/${roomCode}`;
  if (ACTIVE_BIDDING_STATUSES.includes(status)) return `/auction/${roomCode}`;
  return null;
};

const findChampionTeamId = (teams) => {
  if (!teams.length) return null;
  return teams.reduce((best, team) => {
    const spent     = team.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
    const bestSpent = best.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
    return spent > bestSpent ? team : best;
  }, teams[0])?._id?.toString() ?? null;
};

const SummaryStat = ({ label, value, delay }) => (
  <div className="px-4 py-5 text-center animate-num-pop" style={{ animationDelay: delay }}>
    <p className="nums font-mono text-xl font-black text-neutral-100">{value}</p>
    <p className="mt-0.5 text-xs font-medium text-neutral-600">{label}</p>
  </div>
);

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

  // ── Derived values + new hooks — MUST live above the early returns below.
  // Calling hooks conditionally (e.g. only once room.status === 'completed')
  // would change the number of hooks called between renders and trip
  // React's rules of hooks the moment the room finishes loading.
  const championId   = findChampionTeamId(teams);
  const totalPlayers = teams.reduce((s, t) => s + t.squad.length, 0);
  const totalLakhs   = teams.reduce(
    (s, t) => s + t.squad.reduce((ss, e) => ss + e.purchasePriceLakhs, 0),
    0
  );

  // Each stat counts up independently — durations vary slightly (800/900/1100ms)
  // just for a touch of natural variation rather than three identical ticks.
  const animatedFranchiseCount = useCountUp({ to: teams.length, durationMs: 800 });
  const animatedPlayersSold    = useCountUp({ to: totalPlayers, durationMs: 900 });
  const animatedTotalSpent     = useCountUp({ to: totalLakhs, durationMs: 1100 });

  // One-shot confetti burst on the champion's card, fired the first time
  // championId resolves to a real team (i.e. once teams have loaded).
  // hasFiredRef guards against re-firing if this component re-renders after
  // the initial burst — it should only ever happen once per page visit.
  const [showChampionConfetti, setShowChampionConfetti] = useState(false);
  const hasFiredConfettiRef = useRef(false);

  useEffect(() => {
    if (championId && !hasFiredConfettiRef.current) {
      hasFiredConfettiRef.current = true;
      setShowChampionConfetti(true);
      const id = setTimeout(() => setShowChampionConfetti(false), CHAMPION_CONFETTI_MS);
      return () => clearTimeout(id);
    }
  }, [championId]);

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
        <div className="text-center animate-fade-up">
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

        {/* Summary strip — each number counts up, then settles with a num-pop entrance */}
        {teams.length > 0 && (
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 divide-x divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <SummaryStat
              label="Franchises"
              value={Math.round(animatedFranchiseCount)}
              delay="100ms"
            />
            <SummaryStat
              label="Players sold"
              value={Math.round(animatedPlayersSold)}
              delay="200ms"
            />
            <SummaryStat
              label="Total spent"
              value={formatLakhsAsDisplay(Math.round(animatedTotalSpent))}
              delay="300ms"
            />
          </div>
        )}

        {/* Team cards — staggered cascade entrance; champion card gets a
            one-shot confetti burst layered behind its card */}
        {teams.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-neutral-600">No teams found for this room.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {teams.map((team, i) => {
              const isChampion = team._id?.toString() === championId;
              return (
                <div
                  key={team._id}
                  className="relative animate-fade-up"
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  {isChampion && showChampionConfetti && <SoldImpactEffect />}
                  <FinalTeamCard team={team} isChampion={isChampion} />
                </div>
              );
            })}
          </div>
        )}

        <div
          className="mt-12 text-center animate-fade-up"
          style={{ animationDelay: `${400 + teams.length * 100}ms` }}
        >
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