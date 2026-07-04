// client/src/components/auction/MyTeamPanel.jsx

import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const MAX_SQUAD_SIZE     = 11;
const MIN_BOWLING        = 5;
const MIN_WICKETKEEPERS  = 1;

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

const sameId = (a, b) => {
  if (!a || !b) return false;
  const s = (v) => (typeof v === 'object' ? String(v._id ?? v) : String(v));
  return s(a) === s(b);
};

// A compact stat bar — two numbers with a progress-style fill so budget
// depletion and squad growth are readable at a glance, not just from numbers.
const StatBar = ({ label, value, max, formatFn, danger }) => {
  const pct     = Math.min(1, value / max);
  const isEmpty = value === 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        <span className={`nums font-mono text-xs font-bold ${danger && !isEmpty ? 'text-red-400' : 'text-neutral-300'}`}>
          {formatFn ? formatFn(value) : value}
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${danger ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
};

// Requirement chip — green when met, muted when not.
const ReqChip = ({ label, met }) => (
  <div className={[
    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold',
    met ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-500',
  ].join(' ')}>
    {met ? (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" strokeLinecap="round" />
      </svg>
    )}
    {label}
  </div>
);

const MyTeamPanel = () => {
  const { user }   = useSelector((state) => state.auth);
  const { teams }  = useSelector((state) => state.team);
  const { teamSummaries } = useSelector((state) => state.auction);

  const STARTING_BUDGET = 10000; // 100 Cr in Lakhs

  const myTeam   = teams.find((t) => sameId(t.userId, user?._id));
  const summary  = teamSummaries.find((s) => sameId(s.teamId, myTeam?._id));

  if (!myTeam) return null;

  const budget         = summary?.budgetRemainingLakhs ?? myTeam.budgetRemainingLakhs ?? 0;
  const squadSize      = summary?.squadSize            ?? myTeam.squad.length;
  const bowlingCount   = summary?.bowlingOptionsCount  ?? 0;
  const wkCount        = summary?.wicketkeeperCount    ?? 0;
  const slotsLeft      = Math.max(0, MAX_SQUAD_SIZE - squadSize);
  const budgetLow      = budget < 1000; // under ₹10 Cr

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900">
      {/* Header with budget progress bar */}
      <div className="border-b border-neutral-800 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-100 truncate">{myTeam.teamName}</h2>
          <span className="ml-2 shrink-0 rounded-md bg-neutral-800 px-2 py-0.5 font-mono text-xs font-bold text-neutral-400">
            {squadSize}/{MAX_SQUAD_SIZE}
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          <StatBar
            label="Budget remaining"
            value={budget}
            max={STARTING_BUDGET}
            formatFn={formatLakhsAsDisplay}
            danger={budgetLow}
          />
          <StatBar
            label="Squad filled"
            value={squadSize}
            max={MAX_SQUAD_SIZE}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="border-b border-neutral-800 px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
          Requirements
        </p>
        <div className="flex flex-wrap gap-1.5">
          <ReqChip label={`Bowling (${bowlingCount}/${MIN_BOWLING})`} met={bowlingCount >= MIN_BOWLING} />
          <ReqChip label={`WK (${wkCount}/${MIN_WICKETKEEPERS})`}     met={wkCount >= MIN_WICKETKEEPERS} />
          <ReqChip label={`${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left`} met={slotsLeft === 0} />
        </div>
      </div>

      {/* Squad list */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
          My Squad
        </p>

        {myTeam.squad.length === 0 ? (
          <p className="py-3 text-center text-sm text-neutral-700">No players yet.</p>
        ) : (
          <ul className="max-h-52 space-y-1 overflow-y-auto">
            {myTeam.squad.map((entry) => (
              <li
                key={entry.playerId._id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              >
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${ROLE_COLOR[entry.role] ?? 'text-neutral-400 bg-neutral-800'}`}>
                  {ROLE_SHORT[entry.role] ?? entry.role}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-neutral-200">
                  {entry.playerId.name}
                </span>
                <span className="nums shrink-0 font-mono text-xs font-bold text-amber-400">
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

export default MyTeamPanel;