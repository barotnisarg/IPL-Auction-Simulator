// client/src/components/auction/OtherTeamsPanel.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const MAX_SQUAD_SIZE = 11;
const MIN_BOWLING_OPTIONS = 5;
const MIN_WICKETKEEPERS = 1;

const ROLE_DISPLAY_LABELS = {
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

const sameId = (a, b) => {
  if (!a || !b) return false;
  const sa = typeof a === 'object' ? String(a._id ?? a) : String(a);
  const sb = typeof b === 'object' ? String(b._id ?? b) : String(b);
  return sa === sb;
};

const StatPill = ({ label, value, target, met }) => (
  <div className="flex flex-col items-center rounded-lg bg-neutral-950 px-3 py-2">
    <span className={`text-sm font-bold ${met ? 'text-emerald-400' : 'text-neutral-200'}`}>
      {value}
      {target !== undefined && (
        <span className="text-xs font-normal text-neutral-500">/{target}</span>
      )}
    </span>
    <span className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">{label}</span>
  </div>
);

const TeamCard = ({ team, summary, isCurrentBidder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const budget = summary?.budgetRemainingLakhs ?? team.budgetRemainingLakhs ?? 0;
  const squadSize = summary?.squadSize ?? team.squad.length ?? 0;
  const bowlingOptions = summary?.bowlingOptionsCount ?? 0;
  const wicketkeepers = summary?.wicketkeeperCount ?? 0;
  const slotsLeft = Math.max(0, MAX_SQUAD_SIZE - squadSize);
  const squad = team.squad ?? [];

  return (
    <li className={`rounded-xl border ${isCurrentBidder ? 'border-amber-500/40' : 'border-neutral-800'} bg-neutral-950 overflow-hidden`}>

      {/* Collapsed header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-800/40"
      >
        {isCurrentBidder && (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />
        )}

        <span className={`flex-1 truncate text-sm font-semibold ${isCurrentBidder ? 'text-amber-300' : 'text-neutral-200'}`}>
          {team.teamName}
        </span>

        <span className={`shrink-0 font-mono text-sm font-bold ${isCurrentBidder ? 'text-amber-400' : 'text-neutral-300'}`}>
          {formatLakhsAsDisplay(budget)}
        </span>

        <span className="shrink-0 text-xs text-neutral-500">
          {squadSize}/{MAX_SQUAD_SIZE}
        </span>

        <span
          className="shrink-0 text-neutral-600 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      {/* Expanded detail */}
      {isOpen && (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-3">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Budget" value={formatLakhsAsDisplay(budget)} />
            <StatPill
              label="Bowling"
              value={bowlingOptions}
              target={MIN_BOWLING_OPTIONS}
              met={bowlingOptions >= MIN_BOWLING_OPTIONS}
            />
            <StatPill
              label="WK"
              value={wicketkeepers}
              target={MIN_WICKETKEEPERS}
              met={wicketkeepers >= MIN_WICKETKEEPERS}
            />
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-300">{slotsLeft}</span>{' '}
            slot{slotsLeft !== 1 ? 's' : ''} remaining
          </p>

          <h4 className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            Squad ({squadSize}/{MAX_SQUAD_SIZE})
          </h4>

          {squad.length === 0 ? (
            <p className="mt-2 text-xs text-neutral-600">No players purchased yet.</p>
          ) : (
            <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {squad.map((entry, i) => {
                const player = entry.playerId;
                const playerName = player?.name ?? 'Unknown';
                const playerKey = player?._id ?? `entry-${i}`;

                return (
                  <li key={playerKey} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ROLE_COLOR[entry.role] ?? 'text-neutral-400 bg-neutral-700'}`}>
                      {ROLE_DISPLAY_LABELS[entry.role] ?? entry.role}
                    </span>
                    <span className="flex-1 truncate text-xs font-medium text-neutral-200">
                      {playerName}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold text-amber-400">
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
  const { user } = useSelector((state) => state.auth);
  const { teams } = useSelector((state) => state.team);
  const { teamSummaries, highestBidderTeamId } = useSelector((state) => state.auction);

  const myTeamRecord = teams.find((team) => sameId(team.userId, user?._id));
  const otherTeams = teams.filter((team) => !sameId(team._id, myTeamRecord?._id));

  if (otherTeams.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Other Franchises
      </h2>

      <ul className="mt-3 space-y-2">
        {otherTeams.map((team) => {
          const summary = teamSummaries.find((s) => sameId(s.teamId, team._id));
          const isCurrentBidder = sameId(team._id, highestBidderTeamId);

          return (
            <TeamCard
              key={team._id?.toString()}
              team={team}
              summary={summary}
              isCurrentBidder={isCurrentBidder}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default OtherTeamsPanel;