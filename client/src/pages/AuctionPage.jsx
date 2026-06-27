// client/src/pages/AuctionPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import useAuctionRoom from '../hooks/useAuctionRoom';
import Loader from '../components/common/Loader';
import HostControls from '../components/lobby/HostControls';
import AuctionPlayerCard from '../components/auction/AuctionPlayerCard';
import BidControls from '../components/auction/BidControls';
import HistoryPanel from '../components/auction/HistoryPanel';
import MyTeamPanel from '../components/auction/MyTeamPanel';
import OtherTeamsPanel from '../components/auction/OtherTeamsPanel';
import CategoryPlayerListPanel, {
  CategoryListButton,
} from '../components/auction/CategoryPlayerListPanel';
import { useSelector } from 'react-redux';

// Must match server/constants/auctionConstants.js CATEGORY_INTRO_MS.
// The server waits this long before starting the first player's timer after
// a new category begins — so the panel auto-closes exactly when bidding starts.
const CATEGORY_INTRO_MS = 5000;

const AuctionPage = () => {
  const { roomCode } = useParams();
  const { room, roomStatus } = useAuctionRoom(roomCode);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(null);

  const autoCloseTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // The key that changes every time a new category starts — used to detect
  // the transition and auto-open the panel fresh each time.
  const activeCategoryPlayers = useSelector((s) => s.auction.activeCategoryPlayers);
  const categoryKey = activeCategoryPlayers?.category ?? null;

  useEffect(() => {
    // A new category just started (or marquee on first auction start).
    // Auto-open the panel and start the 5-second countdown.
    if (!categoryKey) return;

    // Clear any previous timers from a prior category.
    clearTimeout(autoCloseTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    setIsPanelOpen(true);
    setAutoCloseCountdown(Math.ceil(CATEGORY_INTRO_MS / 1000));

    // Tick the countdown every second so the panel can show it.
    countdownIntervalRef.current = setInterval(() => {
      setAutoCloseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-close after CATEGORY_INTRO_MS — matches the server delay exactly.
    autoCloseTimerRef.current = setTimeout(() => {
      setIsPanelOpen(false);
      setAutoCloseCountdown(null);
    }, CATEGORY_INTRO_MS);

    return () => {
      clearTimeout(autoCloseTimerRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey]);

  const handleClosePanel = () => {
    // User closes manually — cancel the auto-close timer too so it doesn't
    // fire and re-close after the user has already dismissed it.
    clearTimeout(autoCloseTimerRef.current);
    clearInterval(countdownIntervalRef.current);
    setIsPanelOpen(false);
    setAutoCloseCountdown(null);
  };

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading auction..." />;
  }

  if (roomStatus === 'failed' && !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-100">Room not found.</p>
        <p className="mt-2 text-sm text-neutral-400">
          Double check the link, or ask your host to share the room code again.
        </p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      {/* Slide-over panel — auto-opens on category start, user can also open manually */}
      <CategoryPlayerListPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        autoCloseCountdown={autoCloseCountdown}
      />

      {/* Top bar: host controls on left, pool list button on right */}
      <div className="flex items-center justify-between gap-4">
        <HostControls />
        <CategoryListButton onClick={() => setIsPanelOpen(true)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AuctionPlayerCard />
          <BidControls />
          <HistoryPanel type="bid" />
        </div>

        <div className="space-y-6">
          <MyTeamPanel />
          <OtherTeamsPanel />
          <HistoryPanel type="auction" />
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;