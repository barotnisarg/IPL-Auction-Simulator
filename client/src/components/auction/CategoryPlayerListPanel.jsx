// client/src/components/auction/CategoryPlayerListPanel.jsx

import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_LABEL = {
  batter:        'BAT',
  'all-rounder': 'AR',
  bowler:        'BOWL',
  wicketkeeper:  'WK',
};

const ROLE_COLOR = {
  batter:        'text-sky-400 bg-sky-400/10',
  'all-rounder': 'text-violet-400 bg-violet-400/10',
  bowler:        'text-emerald-400 bg-emerald-400/10',
  wicketkeeper:  'text-amber-400 bg-amber-400/10',
};

const CATEGORY_LABEL = {
  marquee:        'Marquee Set',
  pool1:          'Pool 1',
  pool2:          'Pool 2',
  'mini-auction': 'Mini Auction',
};

// Each category gets a distinct accent so the pool transition feels different
// every time — not just another panel opening.
const CATEGORY_ACCENT = {
  marquee:        { text: 'text-amber-400',   border: 'border-amber-500/30',  bar: 'via-amber-500/50'   },
  pool1:          { text: 'text-sky-400',      border: 'border-sky-500/30',    bar: 'via-sky-500/50'     },
  pool2:          { text: 'text-violet-400',   border: 'border-violet-500/30', bar: 'via-violet-500/50'  },
  'mini-auction': { text: 'text-emerald-400',  border: 'border-emerald-500/30',bar: 'via-emerald-500/50' },
};

const CloseIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

// ── Trigger button in the top bar ─────────────────────────────────────────────
export const CategoryListButton = ({ onClick }) => {
  const { activeCategoryPlayers, playerOutcomeMap } = useSelector((s) => s.auction);
  if (!activeCategoryPlayers) return null;

  const { category, players } = activeCategoryPlayers;
  const resolved  = players.filter((p) => playerOutcomeMap[p._id?.toString()]).length;
  const accent    = CATEGORY_ACCENT[category] ?? { text: 'text-neutral-300', border: 'border-neutral-700' };
  const catLabel  = CATEGORY_LABEL[category] ?? category;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-lg border px-3 py-1.5',
        'text-xs font-semibold transition hover:bg-neutral-800 active:scale-95',
        accent.border,
        accent.text,
      ].join(' ')}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" />
      </svg>
      {catLabel}
      <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-neutral-400">
        {resolved}/{players.length}
      </span>
    </button>
  );
};

// ── Panel ─────────────────────────────────────────────────────────────────────
const CategoryPlayerListPanel = ({ isOpen, onClose, autoCloseCountdown = null }) => {
  const { activeCategoryPlayers, playerOutcomeMap } = useSelector((s) => s.auction);

  if (!isOpen || !activeCategoryPlayers) return null;

  const { category, players } = activeCategoryPlayers;
  const catLabel   = CATEGORY_LABEL[category] ?? category;
  const accent     = CATEGORY_ACCENT[category] ?? { text: 'text-neutral-300', border: 'border-neutral-700', bar: 'via-neutral-500/40' };
  const isAutoOpen = autoCloseCountdown !== null;

  const soldCount    = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'sold').length;
  const unsoldCount  = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'unsold').length;
  const pendingCount = players.length - soldCount - unsoldCount;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet — slides up on mobile, fades in centered on desktop */}
      <div className="animate-slide-up flex w-full max-w-md flex-col rounded-t-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/60 sm:animate-fade-up sm:rounded-xl max-h-[88vh]">

        {/* Category-coloured top stripe — visual anchor for which pool this is */}
        <div className={`h-px w-full bg-gradient-to-r from-transparent ${accent.bar} to-transparent`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
              {isAutoOpen ? 'Starting in' : 'Current set'}
            </p>
            <p className={`mt-0.5 text-xl font-black ${accent.text}`}>{catLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status chips */}
            <div className="flex items-center gap-1.5">
              {soldCount > 0 && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  {soldCount} sold
                </span>
              )}
              {unsoldCount > 0 && (
                <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                  {unsoldCount} unsold
                </span>
              )}
              {pendingCount > 0 && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  {pendingCount} left
                </span>
              )}
            </div>

            {/* Countdown ring when auto-open */}
            {isAutoOpen && (
              <div className={[
                'flex h-9 w-9 shrink-0 items-center justify-center',
                'rounded-full border-2 border-neutral-700',
                'font-mono text-sm font-black',
                autoCloseCountdown <= 2 ? 'text-red-400 border-red-500/40' : 'text-neutral-200',
              ].join(' ')}>
                {autoCloseCountdown}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="overflow-y-auto px-4 pb-2 pt-1">
          {players.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-600">No players in this set.</p>
          ) : (
            <ul className="space-y-1">
              {players.map((player) => {
                const outcome    = playerOutcomeMap[player._id?.toString()];
                const isLive     = Boolean(player.isCurrentlyAuctioning);
                const isResolved = Boolean(outcome) && !isLive;

                return (
                  <li
                    key={player._id}
                    className={[
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                      isLive     ? 'bg-amber-500/10 ring-1 ring-amber-500/25' :
                      isResolved ? 'opacity-50' :
                                   'hover:bg-neutral-800/50',
                    ].join(' ')}
                  >
                    {/* Live pulse */}
                    {isLive && (
                      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" />
                    )}

                    {/* Role pill */}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLOR[player.role] ?? 'text-neutral-400 bg-neutral-800'}`}>
                      {ROLE_LABEL[player.role] ?? player.role}
                    </span>

                    {/* Name + country */}
                    <div className="min-w-0 flex-1">
                      <p className={[
                        'truncate text-sm font-semibold',
                        isLive     ? 'text-amber-300' :
                        isResolved ? 'text-neutral-500 line-through decoration-neutral-700' :
                                     'text-neutral-100',
                      ].join(' ')}>
                        {player.name}
                      </p>
                      {player.country && (
                        <p className="text-xs text-neutral-600">{player.country}</p>
                      )}
                    </div>

                    {/* Right side */}
                    {isLive && (
                      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-amber-400">
                        Live
                      </span>
                    )}
                    {!isLive && !outcome && (
                      <span className="nums shrink-0 font-mono text-xs text-neutral-600">
                        {formatLakhsAsDisplay(player.basePriceLakhs)}
                      </span>
                    )}
                    {!isLive && outcome?.type === 'sold' && (
                      <div className="ml-auto shrink-0 text-right">
                        <p className="nums font-mono text-sm font-black text-emerald-400">
                          {formatLakhsAsDisplay(outcome.priceLakhs)}
                        </p>
                        <p className="max-w-[90px] truncate text-xs text-neutral-500">
                          {outcome.teamName}
                        </p>
                      </div>
                    )}
                    {!isLive && outcome?.type === 'unsold' && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-neutral-600">
                        Unsold
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-3 text-center">
          {isAutoOpen ? (
            <p className="text-xs text-neutral-600">
              Bidding starts in{' '}
              <span className={`font-bold ${autoCloseCountdown <= 2 ? 'text-red-400' : 'text-neutral-300'}`}>
                {autoCloseCountdown}s
              </span>
              {' '}— close to begin immediately
            </p>
          ) : (
            <p className="text-xs text-neutral-700">Listed alphabetically · not in auction order</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPlayerListPanel;