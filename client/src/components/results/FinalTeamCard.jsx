// client/src/components/results/FinalTeamCard.jsx

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';
import DownloadPDFButton from './DownloadPDFButton';

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

// Mirrored from server/constants/auctionConstants.js — display only.
// Computed fresh from team.squad here rather than reusing
// auctionSlice.teamSummaries: that data stops being broadcast the instant
// AuctionEngine emits 'ended' and is removed from auctionStateStore, so by
// the time this page renders it would only ever be a frozen, possibly
// stale snapshot — recomputing from the final persisted squad is simpler
// and more honestly "final" than trusting a broadcast that already stopped.
const BOWLING_OPTION_ROLES = ['bowler', 'all-rounder'];
const MIN_BOWLING_OPTIONS = 5;
const MIN_WICKETKEEPERS = 1;
const MAX_SQUAD_SIZE = 11;

const RequirementPill = ({ label, current, required }) => {
  const isMet = current >= required;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isMet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
      }`}
    >
      {label}: {current}/{required}
    </span>
  );
};

const FinalTeamCard = ({ team }) => {
  const ownerName = team.userId?.name || 'Unknown Owner';
  const totalSpentLakhs = team.squad.reduce((sum, entry) => sum + entry.purchasePriceLakhs, 0);
  const bowlingOptionsCount = team.squad.filter((entry) =>
    BOWLING_OPTION_ROLES.includes(entry.role)
  ).length;
  const wicketkeeperCount = team.squad.filter((entry) => entry.role === 'wicketkeeper').length;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-100">{team.teamName}</h2>
          <p className="text-sm text-neutral-500">Owner: {ownerName}</p>
        </div>
        <DownloadPDFButton team={team} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Spent</p>
          <p className="font-mono text-lg font-bold text-amber-400">
            {formatLakhsAsDisplay(totalSpentLakhs)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Remaining</p>
          <p className="font-mono text-lg font-bold text-neutral-200">
            {formatLakhsAsDisplay(team.budgetRemainingLakhs)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Squad</p>
          <p className="font-mono text-lg font-bold text-neutral-200">
            {team.squad.length}/{MAX_SQUAD_SIZE}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <RequirementPill
          label="Bowling"
          current={bowlingOptionsCount}
          required={MIN_BOWLING_OPTIONS}
        />
        <RequirementPill label="WK" current={wicketkeeperCount} required={MIN_WICKETKEEPERS} />
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Squad
      </h3>

      {team.squad.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">No players purchased.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {team.squad.map((entry) => (
            <li
              key={entry.playerId._id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm odd:bg-neutral-950"
            >
              <div>
                <p className="font-medium text-neutral-200">{entry.playerId.name}</p>
                <p className="text-xs text-neutral-500">{ROLE_DISPLAY_LABELS[entry.role]}</p>
              </div>
              <span className="font-mono text-neutral-300">
                {formatLakhsAsDisplay(entry.purchasePriceLakhs)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FinalTeamCard;