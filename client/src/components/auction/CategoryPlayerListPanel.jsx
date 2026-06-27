// client/src/components/auction/CategoryPlayerListPanel.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_LABEL = {
  batter: 'BAT',
  'all-rounder': 'AR',
  bowler: 'BOWL',
  wicketkeeper: 'WK',
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

const CATEGORY_COLOR = {
  marquee:        'text-amber-400 border-amber-400/40',
  pool1:          'text-sky-400 border-sky-400/40',
  pool2:          'text-violet-400 border-violet-400/40',
  'mini-auction': 'text-emerald-400 border-emerald-400/40',
};

// ── Trigger button (rendered in AuctionPage header) ───────────────────────────
export const CategoryListButton = ({ onClick }) => {
  const { activeCategoryPlayers, playerOutcomeMap } = useSelector((s) => s.auction);

  if (!activeCategoryPlayers) return null;

  const { category, players } = activeCategoryPlayers;
  const resolved = players.filter((p) => playerOutcomeMap[p._id?.toString()]).length;
  const colorClass = CATEGORY_COLOR[category] ?? 'text-neutral-300 border-neutral-700';
  const [textColor] = colorClass.split(' ');
  const catLabel = CATEGORY_LABEL[category] ?? category;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-neutral-800 ${colorClass}`}
    >
      <span>📋</span>
      <span className={textColor}>{catLabel}</span>
      <span className="text-neutral-400">{resolved}/{players.length}</span>
    </button>
  );
};

// ── Slide-over panel (full player list with sold/unsold status) ───────────────
const CategoryPlayerListPanel = ({ isOpen, onClose }) => {
  const { activeCategoryPlayers, playerOutcomeMap } = useSelector((s) => s.auction);

  if (!isOpen || !activeCategoryPlayers) return null;

  const { category, players } = activeCategoryPlayers;
  const catLabel = CATEGORY_LABEL[category] ?? category;
  const colorClass = CATEGORY_COLOR[category] ?? 'text-neutral-300 border-neutral-700';
  const [catTextColor] = colorClass.split(' ');

  const soldCount    = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'sold').length;
  const unsoldCount  = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'unsold').length;
  const pendingCount = players.length - soldCount - unsoldCount;

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/70 px-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-md flex-col rounded-t-2xl border border-neutral-800 bg-neutral-900 shadow-2xl sm:rounded-2xl max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Current Set</p>
            <p className={`mt-0.5 text-xl font-black ${catTextColor}`}>{catLabel}</p>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-2 mr-3">
            {soldCount > 0 && (
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {soldCount} sold
              </span>
            )}
            {unsoldCount > 0 && (
              <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-400">
                {unsoldCount} unsold
              </span>
            )}
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Player list — scrollable */}
        <div className="overflow-y-auto px-4 py-3">
          {players.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">No players in this set.</p>
          ) : (
            <ul className="space-y-1">
              {players.map((player) => {
                const outcome = playerOutcomeMap[player._id?.toString()];
                const isResolved = Boolean(outcome);

                return (
                  <li
                    key={player._id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isResolved ? 'opacity-60' : 'hover:bg-neutral-800/50'}`}
                  >
                    {/* Role pill */}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLOR[player.role] ?? 'text-neutral-400 bg-neutral-700'}`}>
                      {ROLE_LABEL[player.role] ?? player.role}
                    </span>

                    {/* Name + country */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isResolved ? 'text-neutral-400 line-through decoration-neutral-600' : 'text-neutral-100'}`}>
                        {player.name}
                      </p>
                      {player.country && (
                        <p className="text-xs text-neutral-500">{player.country}</p>
                      )}
                    </div>

                    {/* Right: outcome or base price */}
                    {!outcome && (
                      <span className="shrink-0 text-xs text-neutral-500">
                        {formatLakhsAsDisplay(player.basePriceLakhs)}
                      </span>
                    )}

                    {outcome?.type === 'sold' && (
                      <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-sm font-black text-emerald-400">
                          {formatLakhsAsDisplay(outcome.priceLakhs)}
                        </span>
                        <span className="max-w-[100px] truncate text-xs font-medium text-neutral-400">
                          {outcome.teamName}
                        </span>
                      </div>
                    )}

                    {outcome?.type === 'unsold' && (
                      <span className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
          <p className="text-xs text-neutral-600">
            Listed alphabetically — not in auction order
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryPlayerListPanel;