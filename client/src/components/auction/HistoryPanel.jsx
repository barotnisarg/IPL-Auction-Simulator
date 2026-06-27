// client/src/components/auction/HistoryPanel.jsx

import { useSelector } from 'react-redux';
import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

// ── Auction history row (right panel — all resolved players) ──────────────────
const AuctionHistoryRow = ({ entry }) => (
  <li className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
    <div>
      <p className="font-medium text-neutral-200">{entry.player.name}</p>
      <p className="text-xs text-neutral-500">{ROLE_DISPLAY_LABELS[entry.player.role]}</p>
    </div>
    {entry.type === 'sold' ? (
      <div className="text-right">
        <p className="font-mono text-sm text-amber-400">{formatLakhsAsDisplay(entry.priceLakhs)}</p>
        <p className="text-xs text-neutral-500">{entry.team.teamName}</p>
      </div>
    ) : (
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
        Unsold
      </span>
    )}
  </li>
);

// ── Per-team highest bid panel (left panel — current player) ──────────────────
const TeamBidLeaderboard = () => {
  const { currentPlayerBidLog, highestBidderTeamId, currentPlayer } =
    useSelector((s) => s.auction);
  const { teams } = useSelector((s) => s.team);

  if (!currentPlayer) {
    return (
      <p className="mt-4 text-center text-sm text-neutral-600">
        Waiting for a player to come up.
      </p>
    );
  }

  // Build a map: teamId → highest amountLakhs bid so far this player
  const highestByTeam = new Map();
  for (const entry of currentPlayerBidLog) {
    const tid = entry.teamId?.toString();
    if (!tid) continue;
    const prev = highestByTeam.get(tid) ?? 0;
    if (entry.amountLakhs > prev) {
      highestByTeam.set(tid, entry.amountLakhs);
    }
  }

  // Teams that placed at least one bid — sorted highest → lowest
  const bidders = teams
    .filter((t) => highestByTeam.has(t._id?.toString()))
    .map((t) => ({
      teamId: t._id?.toString(),
      teamName: t.teamName,
      highestBid: highestByTeam.get(t._id?.toString()),
    }))
    .sort((a, b) => b.highestBid - a.highestBid);

  // Teams that haven't bid yet on this player
  const nonBidders = teams.filter((t) => !highestByTeam.has(t._id?.toString()));

  if (bidders.length === 0) {
    return (
      <p className="mt-4 text-center text-sm text-neutral-600">
        No bids placed yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
      {/* Bidders — ranked highest to lowest */}
      {bidders.map((entry, index) => {
        const isWinner = entry.teamId === highestBidderTeamId?.toString();
        const isTopBid = index === 0;

        return (
          <li
            key={entry.teamId}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              isWinner
                ? 'bg-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-neutral-800/40'
            }`}
          >
            {/* Rank */}
            <span
              className={`w-5 shrink-0 text-center text-xs font-black ${
                isTopBid ? 'text-amber-400' : 'text-neutral-500'
              }`}
            >
              #{index + 1}
            </span>

            {/* Team name */}
            <span
              className={`flex-1 truncate font-semibold ${
                isWinner ? 'text-amber-300' : 'text-neutral-200'
              }`}
            >
              {entry.teamName}
            </span>

            {/* Highest bid amount */}
            <span
              className={`shrink-0 font-mono font-bold ${
                isWinner ? 'text-amber-400' : 'text-neutral-300'
              }`}
            >
              {formatLakhsAsDisplay(entry.highestBid)}
            </span>

            {/* Winner crown */}
            {isWinner && (
              <span className="shrink-0 text-base leading-none">👑</span>
            )}
          </li>
        );
      })}

      {/* Non-bidders — dimmed at the bottom so users see who hasn't engaged */}
      {nonBidders.map((team) => (
        <li
          key={team._id?.toString()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-35"
        >
          <span className="w-5 shrink-0 text-center text-xs font-black text-neutral-600">
            —
          </span>
          <span className="flex-1 truncate font-semibold text-neutral-500">
            {team.teamName}
          </span>
          <span className="shrink-0 font-mono text-xs text-neutral-600">No bid</span>
        </li>
      ))}
    </ul>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const HistoryPanel = ({ type = 'bid' }) => {
  const { auctionHistory } = useSelector((state) => state.auction);
  const isBidMode = type === 'bid';
  const title = isBidMode ? 'Team Bids' : 'Auction History';

  const auctionEntries = [...auctionHistory].reverse();

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {title}
      </h2>

      {isBidMode ? (
        <TeamBidLeaderboard />
      ) : (
        <>
          {auctionEntries.length === 0 ? (
            <p className="mt-4 text-center text-sm text-neutral-600">
              No players resolved yet.
            </p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {auctionEntries.map((entry, index) => (
                <AuctionHistoryRow key={`${entry.player._id}-${index}`} entry={entry} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPanel;