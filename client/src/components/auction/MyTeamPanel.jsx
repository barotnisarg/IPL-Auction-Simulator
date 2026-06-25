// client/src/components/auction/MyTeamPanel.jsx

import { useSelector } from 'react-redux';

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const MAX_SQUAD_SIZE = 11;
const MIN_BOWLING_OPTIONS = 5;
const MIN_WICKETKEEPERS = 1;

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

const RequirementBadge = ({ label, current, required }) => {
  const isMet = current >= required;
  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-950 px-3 py-2">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className={`text-xs font-semibold ${isMet ? 'text-emerald-400' : 'text-neutral-300'}`}>
        {current} / {required}
      </span>
    </div>
  );
};

const MyTeamPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  const { teamSummaries } = useSelector((state) => state.auction);

  const myTeamRecord = teams.find((team) => team.userId._id === user?._id);
  const mySummary = teamSummaries.find((summary) => summary.teamId === myTeamRecord?._id);

  if (!myTeamRecord) {
    return null;
  }

  const budgetRemainingLakhs =
    mySummary?.budgetRemainingLakhs ?? myTeamRecord.budgetRemainingLakhs ?? 0;
  const squadSize = mySummary?.squadSize ?? myTeamRecord.squad.length;
  const bowlingOptionsCount = mySummary?.bowlingOptionsCount ?? 0;
  const wicketkeeperCount = mySummary?.wicketkeeperCount ?? 0;
  const slotsRemaining = Math.max(0, MAX_SQUAD_SIZE - squadSize);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          {myTeamRecord.teamName}
        </h2>
        <span className="text-xs text-neutral-500">{slotsRemaining} slots left</span>
      </div>

      <p className="mt-3 text-3xl font-black text-amber-400">
        {formatLakhsAsDisplay(budgetRemainingLakhs)}
      </p>
      <p className="text-xs uppercase tracking-wider text-neutral-500">Budget remaining</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <RequirementBadge
          label="Bowling options"
          current={bowlingOptionsCount}
          required={MIN_BOWLING_OPTIONS}
        />
        <RequirementBadge
          label="Wicketkeepers"
          current={wicketkeeperCount}
          required={MIN_WICKETKEEPERS}
        />
      </div>

      <h3 className="mt-5 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        My Squad ({squadSize}/{MAX_SQUAD_SIZE})
      </h3>

      {myTeamRecord.squad.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">No players purchased yet.</p>
      ) : (
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {myTeamRecord.squad.map((entry) => (
            <li
              key={entry.playerId._id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-neutral-200">{entry.playerId.name}</p>
                <p className="text-xs text-neutral-500">{ROLE_DISPLAY_LABELS[entry.role]}</p>
              </div>
              <span className="font-mono text-amber-400">
                {formatLakhsAsDisplay(entry.purchasePriceLakhs)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyTeamPanel;