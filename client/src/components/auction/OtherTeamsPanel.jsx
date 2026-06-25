// client/src/components/auction/OtherTeamsPanel.jsx

import { useSelector } from 'react-redux';

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const MAX_SQUAD_SIZE = 11;

const OtherTeamsPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  const { teamSummaries, highestBidderTeamId } = useSelector((state) => state.auction);

  const myTeamRecord = teams.find((team) => team.userId._id === user?._id);

  const otherTeams = teams
    .filter((team) => team._id !== myTeamRecord?._id)
    .map((team) => {
      const summary = teamSummaries.find((entry) => entry.teamId === team._id);
      return {
        teamId: team._id,
        teamName: team.teamName,
        budgetRemainingLakhs: summary?.budgetRemainingLakhs ?? team.budgetRemainingLakhs,
        squadSize: summary?.squadSize ?? team.squad.length,
      };
    });

  if (otherTeams.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Other Franchises
      </h2>

      <ul className="mt-3 space-y-2">
        {otherTeams.map((team) => {
          const isBidding = team.teamId === highestBidderTeamId;

          return (
            <li
              key={team.teamId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isBidding ? 'bg-amber-500/10' : 'bg-neutral-950'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                {team.teamName}
                {isBidding && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                )}
              </span>

              <div className="text-right">
                <p className="font-mono text-sm text-neutral-300">
                  {formatLakhsAsDisplay(team.budgetRemainingLakhs)}
                </p>
                <p className="text-xs text-neutral-500">
                  {team.squadSize}/{MAX_SQUAD_SIZE} players
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OtherTeamsPanel;