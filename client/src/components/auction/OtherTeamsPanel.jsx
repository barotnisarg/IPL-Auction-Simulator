// client/src/components/auction/OtherTeamsPanel.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const MAX_SQUAD_SIZE    = 11;
const MIN_BOWLING       = 5;
const MIN_WICKETKEEPERS = 1;

const ROLE_SHORT = {
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

const sameId = (a, b) => {
  if (!a || !b) return false;
  const s = (v) => (typeof v === 'object' ? String(v._id ?? v) : String(v));
  return s(a) === s(b);
};

const ChevronIcon = ({ open }) => (
  <svg
    className={`h-4 w-4 shrink-0 text-neutral-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TeamCard = ({ team, summary, isLeading }) => {
  const [open, setOpen] = useState(false);

  const budget       = summary?.budgetRemainingLakhs ?? team.budgetRemainingLakhs ?? 0;
  const squadSize    = summary?.squadSize            ?? team.squad?.length ?? 0;
  const bowling      = summary?.bowlingOptionsCount  ?? 0;
  const wk           = summary?.wicketkeeperCount    ?? 0;
  const slotsLeft    = Math.max(0, MAX_SQUAD_SIZE - squadSize);
  const squad        = team.squad ?? [];

  return (
    <li className={[
      'overflow-hidden rounded-lg border transition-colors',
      isLeading ? 'border-amber-500/30 bg-amber-500/5' : 'border-neutral-800 bg-neutral-950',
    ].join(' ')}>

      {/* Collapsed row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-neutral-800/30 active:bg-neutral-800/50"
      >
        {isLeading && (
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" />
        )}

        <span className={`flex-1 truncate text-sm font-bold ${isLeading ? 'text-amber-200' : 'text-neutral-200'}`}>
          {team.teamName}
        </span>

        <span className={`nums shrink-0 font-mono text-sm font-bold ${isLeading ? 'text-amber-400' : 'text-neutral-400'}`}>
          {formatLakhsAsDisplay(budget)}
        </span>

        <span className="shrink-0 font-mono text-xs text-neutral-600">
          {squadSize}/{MAX_SQUAD_SIZE}
        </span>

        <ChevronIcon open={open} />
      </button>

      {/* Expanded content — animates open */}
      {open && (
        <div className="animate-fade-up border-t border-neutral-800 px-4 pb-4 pt-3">

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Budget',   value: formatLakhsAsDisplay(budget) },
              { label: `Bowl ${bowling}/${MIN_BOWLING}`, value: bowling >= MIN_BOWLING ? '✓' : `${MIN_BOWLING - bowling} more`, ok: bowling >= MIN_BOWLING },
              { label: `WK ${wk}/${MIN_WICKETKEEPERS}`, value: wk >= MIN_WICKETKEEPERS ? '✓' : 'Need 1', ok: wk >= MIN_WICKETKEEPERS },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-neutral-900 px-2 py-2 text-center">
                <p className={`text-xs font-bold ${stat.ok === true ? 'text-emerald-400' : stat.ok === false ? 'text-red-400' : 'text-neutral-200'}`}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-neutral-600">
            {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining
          </p>

          {/* Squad */}
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-700">
            Squad ({squadSize}/{MAX_SQUAD_SIZE})
          </p>

          {squad.length === 0 ? (
            <p className="mt-2 text-xs text-neutral-700">No players yet.</p>
          ) : (
            <ul className="mt-1.5 max-h-44 space-y-1 overflow-y-auto">
              {squad.map((entry, i) => {
                const player = entry.playerId;
                return (
                  <li key={player?._id ?? i} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${ROLE_COLOR[entry.role] ?? 'text-neutral-500 bg-neutral-800'}`}>
                      {ROLE_SHORT[entry.role] ?? entry.role}
                    </span>
                    <span className="flex-1 truncate text-xs font-medium text-neutral-300">
                      {player?.name ?? 'Unknown'}
                    </span>
                    <span className="nums shrink-0 font-mono text-xs font-bold text-amber-500">
                      {formatLakhsAsDisplay(entry.purchasePriceLakhs)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

const OtherTeamsPanel = () => {
  const { user }   = useSelector((state) => state.auth);
  const { teams }  = useSelector((state) => state.team);
  const { teamSummaries, highestBidderTeamId } = useSelector((state) => state.auction);

  const myTeam     = teams.find((t) => sameId(t.userId, user?._id));
  const otherTeams = teams.filter((t) => !sameId(t._id, myTeam?._id));

  if (otherTeams.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600">
        Other Franchises
      </h2>

      <ul className="mt-3 space-y-2">
        {otherTeams.map((team) => (
          <TeamCard
            key={team._id?.toString()}
            team={team}
            summary={teamSummaries.find((s) => sameId(s.teamId, team._id))}
            isLeading={sameId(team._id, highestBidderTeamId)}
          />
        ))}
      </ul>
    </div>
  );
};

export default OtherTeamsPanel;