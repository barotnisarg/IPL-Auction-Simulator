// client/src/components/auction/HistoryPanel.jsx

import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_LABELS = {
  batter:        'Batter',
  'all-rounder': 'All-Rounder',
  bowler:        'Bowler',
  wicketkeeper:  'Wicketkeeper',
};

// ── Auction log row ───────────────────────────────────────────────────────────
const AuctionHistoryRow = ({ entry }) => (
  <li className="flex items-center justify-between rounded-lg px-3 py-2">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-neutral-200">{entry.player.name}</p>
      <p className="text-xs text-neutral-600">{ROLE_LABELS[entry.player.role]}</p>
    </div>
    {entry.type === 'sold' ? (
      <div className="ml-3 shrink-0 text-right">
        <p className="nums font-mono text-sm font-bold text-amber-400">
          {formatLakhsAsDisplay(entry.priceLakhs)}
        </p>
        <p className="max-w-[80px] truncate text-xs text-neutral-500">{entry.team.teamName}</p>
      </div>
    ) : (
      <span className="ml-3 shrink-0 text-xs font-semibold text-neutral-700">
        Unsold
      </span>
    )}
  </li>
);

// ── Per-team highest bid leaderboard ──────────────────────────────────────────
const TeamBidLeaderboard = () => {
  const { currentPlayerBidLog, highestBidderTeamId, currentPlayer } =
    useSelector((s) => s.auction);
  const { teams } = useSelector((s) => s.team);

  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-neutral-700">No player up yet.</p>
      </div>
    );
  }

  // Highest bid per team
  const highestByTeam = new Map();
  for (const entry of currentPlayerBidLog) {
    const tid = entry.teamId?.toString();
    if (!tid) continue;
    if ((entry.amountLakhs ?? 0) > (highestByTeam.get(tid) ?? 0)) {
      highestByTeam.set(tid, entry.amountLakhs);
    }
  }

  const bidders = teams
    .filter((t) => highestByTeam.has(t._id?.toString()))
    .map((t) => ({ teamId: t._id?.toString(), teamName: t.teamName, highestBid: highestByTeam.get(t._id?.toString()) }))
    .sort((a, b) => b.highestBid - a.highestBid);

  const nonBidders = teams.filter((t) => !highestByTeam.has(t._id?.toString()));

  if (bidders.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-neutral-700">No bids yet.</p>
      </div>
    );
  }

  return (
    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
      {bidders.map(({ teamId, teamName, highestBid }, i) => {
        const isWinner = teamId === highestBidderTeamId?.toString();
        return (
          <li
            key={teamId}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
              'transition-colors',
              isWinner ? 'bg-amber-500/10 ring-1 ring-amber-500/25' : 'bg-neutral-800/30',
            ].join(' ')}
          >
            <span className={`w-5 shrink-0 text-center font-mono text-xs font-black ${i === 0 ? 'text-amber-400' : 'text-neutral-600'}`}>
              #{i + 1}
            </span>
            <span className={`flex-1 truncate font-semibold ${isWinner ? 'text-amber-200' : 'text-neutral-300'}`}>
              {teamName}
            </span>
            <span className={`nums shrink-0 font-mono font-bold ${isWinner ? 'text-amber-400' : 'text-neutral-400'}`}>
              {formatLakhsAsDisplay(highestBid)}
            </span>
            {isWinner && <span className="shrink-0 text-sm">👑</span>}
          </li>
        );
      })}

      {nonBidders.map((team) => (
        <li
          key={team._id?.toString()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-25"
        >
          <span className="w-5 shrink-0 text-center font-mono text-xs text-neutral-700">—</span>
          <span className="flex-1 truncate font-semibold text-neutral-500">{team.teamName}</span>
          <span className="nums shrink-0 font-mono text-xs text-neutral-700">—</span>
        </li>
      ))}
    </ul>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const HistoryPanel = ({ type = 'bid' }) => {
  const { auctionHistory } = useSelector((state) => state.auction);
  const isBidMode = type === 'bid';

  const entries = [...auctionHistory].reverse();

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600">
        {isBidMode ? 'Team Bids' : 'Auction Log'}
      </h2>

      {isBidMode ? (
        <TeamBidLeaderboard />
      ) : entries.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-neutral-700">No results yet.</p>
        </div>
      ) : (
        <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
          {entries.map((entry, i) => (
            <AuctionHistoryRow key={`${entry.player._id}-${i}`} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;