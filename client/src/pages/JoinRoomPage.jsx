// client/src/pages/JoinRoomPage.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

import { joinRoom } from '../features/room/roomSlice';
import Button from '../components/common/Button';

const BackLink = ({ to }) => (
  <Link
    to={to}
    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-200"
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Back
  </Link>
);

const JoinRoomPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.room);

  const [form, setForm] = useState({ roomCode: '', teamName: '' });
  const isLoading = status === 'loading';

  const set = (field) => (e) =>
    setForm((p) => ({
      ...p,
      [field]: field === 'roomCode' ? e.target.value.toUpperCase() : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(joinRoom(form)).unwrap();
      navigate(`/lobby/${result.data.room.roomCode}`);
    } catch {
      // error lives in redux state
    }
  };

  const INPUT_BASE = 'mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950">
      <header className="px-5 py-4 md:px-8">
        <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <BackLink to="/" />

          <h1 className="text-2xl font-black text-neutral-100">Join a room</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter the code your host shared to jump straight into the auction.
          </p>

          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="roomCode" className="block text-sm font-semibold text-neutral-300">
                  Room code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  autoComplete="off"
                  required
                  maxLength={6}
                  value={form.roomCode}
                  onChange={set('roomCode')}
                  placeholder="ABC123"
                  className={`${INPUT_BASE} font-mono text-lg font-bold uppercase tracking-[0.25em] text-amber-400 placeholder-neutral-700`}
                />
              </div>

              <div>
                <label htmlFor="teamName" className="block text-sm font-semibold text-neutral-300">
                  Your team name
                </label>
                <input
                  id="teamName"
                  type="text"
                  autoComplete="off"
                  required
                  minLength={2}
                  maxLength={40}
                  value={form.teamName}
                  onChange={set('teamName')}
                  placeholder="e.g. Chennai Challengers"
                  className={INPUT_BASE}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <svg className="mt-px h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} size="lg" className="mt-1 w-full">
                Join room
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            No room yet?{' '}
            <Link to="/create-room" className="font-semibold text-amber-400 hover:text-amber-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;