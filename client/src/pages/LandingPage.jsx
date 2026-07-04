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
    description: 'Marquee, Pool 1, Pool 2, then a Mini-Auction for unsold players.',
  },
  {
    number: '03',
    title: 'Build your squad',
    description: '₹100 Cr budget. 11 players. The right mix of bat, ball, and a keeper.',
  },
];

// A static preview of the auction UI — gives visitors an immediate sense
// of what they're getting into without any live data.
const PreviewCard = () => (
  <div className="w-full max-w-sm overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/60">
    {/* Thin amber top stripe — the one decorative element that isn't a div */}
    <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

    <div className="p-5">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live · Marquee
        </span>
        <span className="rounded-md bg-neutral-800 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
          7s
        </span>
      </div>

      {/* Player block */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
          <svg className="h-7 w-7 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-neutral-100">Virat Kohli</p>
          <p className="text-sm text-neutral-400">Batter · India</p>
          <p className="mt-0.5 text-xs text-neutral-600">Base ₹2 Cr</p>
        </div>
      </div>

      {/* Bid row */}
      <div className="mt-4 flex items-end justify-between border-t border-neutral-800 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Current bid</p>
          <p className="nums font-mono text-2xl font-black text-amber-400">₹15.5 Cr</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Leading</p>
          <p className="text-sm font-semibold text-neutral-200">Mumbai XI</p>
        </div>
      </div>

      {/* Fake bid + skip buttons */}
      <div className="mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-neutral-950">
          Bid ₹16 Cr
        </div>
        <div className="flex h-10 w-20 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-sm font-semibold text-neutral-400">
          Skip
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-dvh bg-neutral-950">
      {/* ── Nav ── */}
      <header className="flex items-center justify-between border-b border-neutral-900 px-5 py-4 md:px-10">
        <span className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </span>

        {!isAuthenticated && (
          <nav className="flex items-center gap-1">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="ml-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-amber-400 active:bg-amber-600"
            >
              Sign up
            </Link>
          </nav>
        )}
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-16 md:px-10 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Real-time auction room
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[1.08] tracking-tight text-neutral-100 md:text-5xl lg:text-6xl">
              Bid. Build.<br />
              <span className="text-amber-400">Win the room.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-400">
              Create a room for up to five franchises. Bid live across every
              pool from Marquee to the Mini-Auction. Walk away with a squad
              you can actually defend.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={isAuthenticated ? '/create-room' : '/register'}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-500 px-6 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                Create a room
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                to="/join-room"
                className="inline-flex h-11 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-6 text-sm font-semibold text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-800 active:bg-neutral-900"
              >
                Join a room
              </Link>
            </div>
          </div>

          {/* Preview card — hidden on very small screens to save space */}
          <div className="hidden justify-end sm:flex">
            <PreviewCard />
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-neutral-900">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              How it works
            </p>
            <h2 className="mt-2 text-xl font-bold text-neutral-100">
              Three steps to auction day
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-px border border-neutral-800 bg-neutral-800 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="bg-neutral-950 px-6 py-8"
                >
                  <span className="font-mono text-xs font-bold text-neutral-700">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-neutral-100">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="border-t border-neutral-900">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-14 text-center md:px-10">
            <p className="text-xl font-black text-neutral-100">Ready to bid?</p>
            <p className="text-sm text-neutral-500">No download. Works on any device.</p>
            <Link
              to={isAuthenticated ? '/create-room' : '/register'}
              className="inline-flex h-10 items-center rounded-lg bg-amber-500 px-6 text-sm font-bold text-neutral-950 transition hover:bg-amber-400 active:bg-amber-600"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;