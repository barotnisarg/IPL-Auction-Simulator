// client/src/pages/LandingPage.jsx

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const STEPS = [
  {
    number: '01',
    title: 'Create or join a room',
    description: 'One host, up to five franchises, one shared room code.',
  },
  {
    number: '02',
    title: 'Bid live',
    description: 'Marquee, Pool 1, Pool 2, then a secret Mini-Auction for unsold players.',
  },
  {
    number: '03',
    title: 'Build your squad',
    description: '100 Cr budget, 11 players, the right mix of bat, ball, and a keeper.',
  },
];

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          IPL Auction Simulator
        </span>

        {!isAuthenticated && (
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-300">
            <Link to="/login" className="hover:text-neutral-100">
              Log in
            </Link>
            <Link to="/register" className="hover:text-neutral-100">
              Sign up
            </Link>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8 md:px-12">
        <section className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Real-time auction room
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-neutral-100 md:text-5xl">
              Bid. Build. Win the room.
            </h1>
            <p className="mt-4 max-w-md text-base text-neutral-400">
              Create a room for up to five franchises, bid live across every pool from
              Marquee to the Mini-Auction, and walk away with a squad you can actually
              defend.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/create-room"
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 text-lg font-semibold text-neutral-950 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                Create a Room
              </Link>
              <Link
                to="/join-room"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 px-6 py-3 text-lg font-semibold text-neutral-100 transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                Join a Room
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-xs rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
                <span className="text-xs uppercase tracking-wider text-neutral-500">
                  Marquee
                </span>
              </div>

              <div className="mt-6 flex h-28 items-center justify-center rounded-xl bg-neutral-800 text-neutral-600">
                <svg
                  className="h-12 w-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </div>

              <p className="mt-4 text-sm font-semibold text-neutral-200">Marquee Player</p>
              <p className="text-xs text-neutral-500">All-Rounder</p>

              <div className="mt-4 flex items-end justify-between border-t border-neutral-800 pt-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">
                    Current bid
                  </p>
                  <p className="text-2xl font-bold text-amber-400">₹4.50 Cr</p>
                </div>
                <p className="text-xs text-neutral-500">7s left</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            How it works
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="text-3xl font-black text-neutral-800">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold text-neutral-100">{step.title}</h3>
                <p className="mt-1 text-sm text-neutral-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;