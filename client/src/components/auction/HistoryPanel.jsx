// client/src/components/auction/HistoryPanel.jsx

import { useSelector } from 'react-redux';

import { formatLakhsAsDisplay } from '../../utils/formatCurrency';

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

const BidHistoryRow = ({ entry, teamName, isLatest }) => (
  <li
    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
      isLatest ? 'bg-amber-500/10 text-amber-300' : 'text-neutral-300'
    }`}
  >
    <span className="font-medium">{teamName || 'Unknown team'}</span>
    <span className="font-mono">{formatLakhsAsDisplay(entry.amountLakhs)}</span>
  </li>
);

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

const HistoryPanel = ({ type = 'bid' }) => {
  const { currentPlayerBidLog, auctionHistory } = useSelector((state) => state.auction);
  const { teams } = useSelector((state) => state.team);

  const title = type === 'bid' ? 'Bid History' : 'Auction History';
  const isBidMode = type === 'bid';

  // currentPlayerBidLog only stores teamId — resolving names here, once,
  // rather than asking auctionSlice.js to duplicate team names it would
  // need to keep in sync with teamSlice itself.
  const entries = isBidMode ? [...currentPlayerBidLog].reverse() : [...auctionHistory].reverse();

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{title}</h2>

      {entries.length === 0 ? (
        <p className="mt-4 text-center text-sm text-neutral-600">
          {isBidMode ? 'No bids yet on this player.' : 'No players resolved yet.'}
        </p>
      ) : (
        <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {isBidMode
            ? entries.map((entry, index) => (
                <BidHistoryRow
                  key={`${entry.teamId}-${entry.amountLakhs}-${index}`}
                  entry={entry}
                  teamName={teams.find((team) => team._id === entry.teamId)?.teamName}
                  isLatest={index === 0}
                />
              ))
            : entries.map((entry, index) => (
                <AuctionHistoryRow key={`${entry.player._id}-${index}`} entry={entry} />
              ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;