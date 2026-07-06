// client/src/components/results/FinalTeamCard.jsx

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import DownloadPDFButton from './DownloadPDFButton';

const ROLE_LABELS = {
  batter:        'Batter',
  'all-rounder': 'All-Rounder',
  bowler:        'Bowler',
  wicketkeeper:  'Wicketkeeper',
};

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

const BOWLING_OPTION_ROLES  = ['bowler', 'all-rounder'];
const MIN_BOWLING_OPTIONS   = 5;
const MIN_WICKETKEEPERS     = 1;
const MAX_SQUAD_SIZE        = 11;

const ReqPill = ({ label, current, required }) => {
  const met = current >= required;
  return (
    <span className={[
      'rounded-md px-2 py-1 text-xs font-semibold',
      met ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500',
    ].join(' ')}>
      {label} {current}/{required}
    </span>
  );
};

const FinalTeamCard = ({ team, isChampion = false }) => {
  const ownerName       = team.userId?.name ?? 'Unknown';
  const totalSpentLakhs = team.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
  const bowlingCount    = team.squad.filter((e) => BOWLING_OPTION_ROLES.includes(e.role)).length;
  const wkCount         = team.squad.filter((e) => e.role === 'wicketkeeper').length;
  const squadSize       = team.squad.length;

  return (
    <div className={[
      'overflow-hidden rounded-xl border bg-neutral-900',
      isChampion ? 'border-amber-500/40' : 'border-neutral-800',
    ].join(' ')}>
      <div className={[
        'h-px w-full bg-gradient-to-r from-transparent to-transparent',
        isChampion ? 'via-amber-500/60' : 'via-neutral-700/40',
      ].join(' ')} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-black text-neutral-100">{team.teamName}</h2>
            {isChampion && (
              <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                🏆 Top spend
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-600">{ownerName}</p>
        </div>
        <DownloadPDFButton team={team} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800 border-t border-neutral-800">
        {[
          { label: 'Spent',     value: formatLakhsAsDisplay(totalSpentLakhs),          color: 'text-amber-400' },
          { label: 'Remaining', value: formatLakhsAsDisplay(team.budgetRemainingLakhs), color: 'text-neutral-300' },
          { label: 'Squad',     value: `${squadSize}/${MAX_SQUAD_SIZE}`,               color: 'text-neutral-300' },
        ].map((stat) => (
          <div key={stat.label} className="px-3 py-3 text-center">
            <p className={`nums font-mono text-base font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Requirements */}
      <div className="flex flex-wrap gap-1.5 border-t border-neutral-800 px-5 py-3">
        <ReqPill label="Bowling" current={bowlingCount} required={MIN_BOWLING_OPTIONS} />
        <ReqPill label="WK"      current={wkCount}      required={MIN_WICKETKEEPERS} />
      </div>

      {/* Squad — rows cascade in with staggered delays */}
      <div className="border-t border-neutral-800 px-5 pt-4 pb-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-700">
          Squad ({squadSize}/{MAX_SQUAD_SIZE})
        </p>

        {squadSize === 0 ? (
          <p className="text-sm text-neutral-700">No players purchased.</p>
        ) : (
          <ul className="space-y-1">
            {team.squad.map((entry, i) => (
              <li
                key={entry.playerId._id ?? i}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 animate-row-enter',
                  i % 2 === 0 ? 'bg-neutral-950' : '',
                ].join(' ')}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${ROLE_COLOR[entry.role] ?? 'text-neutral-500 bg-neutral-800'}`}>
                  {ROLE_SHORT[entry.role] ?? entry.role}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-200">
                    {entry.playerId.name}
                  </p>
                </div>
                <span className="nums shrink-0 font-mono text-sm font-bold text-amber-400">
                  {formatLakhsAsDisplay(entry.purchasePriceLakhs)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FinalTeamCard;