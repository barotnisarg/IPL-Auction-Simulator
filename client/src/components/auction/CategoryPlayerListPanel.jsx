// client/src/components/auction/CategoryPlayerListPanel.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_DISPLAY = {
  batter: 'BAT', 'all-rounder': 'AR', bowler: 'BOWL', wicketkeeper: 'WK',
};
const ROLE_COLOR = {
  batter: 'text-sky-400 bg-sky-400/10',
  'all-rounder': 'text-violet-400 bg-violet-400/10',
  bowler: 'text-emerald-400 bg-emerald-400/10',
  wicketkeeper: 'text-amber-400 bg-amber-400/10',
};
const CATEGORY_LABEL = {
  marquee: 'Marquee Set', pool1: 'Pool 1', pool2: 'Pool 2', 'mini-auction': 'Mini Auction',
};
const CATEGORY_COLOR = {
  marquee: 'text-amber-400', pool1: 'text-sky-400',
  pool2: 'text-violet-400', 'mini-auction': 'text-emerald-400',
};

const CategoryPlayerListPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeCategoryIntro, playerOutcomeMap } = useSelector((state) => state.auction);

  if (!activeCategoryIntro) return null;

  const { category, players } = activeCategoryIntro;
  const catLabel = CATEGORY_LABEL[category] ?? category;
  const catColor = CATEGORY_COLOR[category] ?? 'text-neutral-100';

  const soldCount = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'sold').length;
  const unsoldCount = players.filter((p) => playerOutcomeMap[p._id?.toString()]?.type === 'unsold').length;
  const pendingCount = players.length - soldCount - unsoldCount;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-neutral-800/40"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${catColor}`}>{catLabel}</span>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-400">
              {players.length} players
            </span>
            {soldCount > 0 && (
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-400">
                {soldCount} sold
              </span>
            )}
            {unsoldCount > 0 && (
              <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-neutral-400">
                {unsoldCount} unsold
              </span>
            )}
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>
        <span className="text-neutral-500 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-800 px-4 pb-3 pt-2">
          {players.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500">No players in this set.</p>
          ) : (
            <ul className="space-y-1">
              {players.map((player) => {
                const outcome = playerOutcomeMap[player._id?.toString()];
                return (
                  <li key={player._id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLOR[player.role] ?? 'text-neutral-400 bg-neutral-700'}`}>
                      {ROLE_DISPLAY[player.role] ?? player.role}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${outcome ? 'text-neutral-400' : 'text-neutral-100'}`}>
                        {player.name}
                      </p>
                      {player.country && <p className="text-xs text-neutral-600">{player.country}</p>}
                    </div>
                    {!outcome && (
                      <span className="shrink-0 text-xs text-neutral-500">
                        {formatLakhsAsDisplay(player.basePriceLakhs)}
                      </span>
                    )}
                    {outcome?.type === 'sold' && (
                      <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-xs font-bold text-emerald-400">
                          {formatLakhsAsDisplay(outcome.priceLakhs)}
                        </span>
                        <span className="max-w-[90px] truncate text-xs text-neutral-400">
                          {outcome.teamName}
                        </span>
                      </div>
                    )}
                    {outcome?.type === 'unsold' && (
                      <span className="ml-auto shrink-0 text-xs font-semibold text-neutral-500">Unsold</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryPlayerListPanel;