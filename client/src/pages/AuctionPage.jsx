// client/src/pages/AuctionPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

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

const CATEGORY_INTRO_MS = 5000;

const AuctionPage = () => {
  const { roomCode } = useParams();
  const { room, roomStatus } = useAuctionRoom(roomCode);

  const [isPanelOpen, setIsPanelOpen]           = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(null);

  const autoCloseTimerRef    = useRef(null);
  const countdownIntervalRef = useRef(null);

  const activeCategoryPlayers = useSelector((s) => s.auction.activeCategoryPlayers);
  const categoryKey = activeCategoryPlayers?.category ?? null;

  useEffect(() => {
    if (!categoryKey) return;

    clearTimeout(autoCloseTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    setIsPanelOpen(true);
    setAutoCloseCountdown(Math.ceil(CATEGORY_INTRO_MS / 1000));

    countdownIntervalRef.current = setInterval(() => {
      setAutoCloseCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownIntervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);

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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-base font-bold text-neutral-100">Room not found.</p>
        <p className="text-sm text-neutral-500">
          Double check the link, or ask your host to share the room code again.
        </p>
      </div>
    );
  }

  if (!room) return null;

  return (
    // Extra bottom padding on mobile so the sticky BidControls bar
    // doesn't overlap the last card in the scroll.
    <div className="min-h-dvh bg-neutral-950 pb-32 md:pb-6">
      {/* Category player list panel — full-screen overlay */}
      <CategoryPlayerListPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        autoCloseCountdown={autoCloseCountdown}
      />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-tight text-neutral-100">
            Cric<span className="text-amber-400">Bid</span>
          </span>
          <div className="flex items-center gap-2">
            <CategoryListButton onClick={() => setIsPanelOpen(true)} />
            <HostControls />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl px-4 pt-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Left column: player card + history */}
          <div className="space-y-4 lg:col-span-2">
            <AuctionPlayerCard />
            <HistoryPanel type="bid" />
          </div>

          {/* Right column: my team + others + auction log
              Hidden on mobile — accessible by scrolling below the sticky bar */}
          <div className="space-y-4">
            <MyTeamPanel />
            <OtherTeamsPanel />
            <HistoryPanel type="auction" />
          </div>
        </div>
      </main>

      {/* ── Sticky bottom bid bar (mobile only) ──
          On desktop BidControls renders inline inside the card.
          On mobile it sticks to the bottom so the user never has to scroll
          to place a bid — the most critical action in the whole app. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-950/95 px-4 pb-safe pt-3 backdrop-blur-sm md:hidden">
        <BidControls compact />
      </div>

      {/* Desktop inline bid controls — hidden on mobile (handled above) */}
      <div className="mx-auto hidden max-w-6xl px-4 md:block">
        <div className="mt-4 lg:col-span-2">
          {/* Intentionally rendered outside the grid on desktop so it
              doesn't need a wrapper element that disrupts grid layout */}
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;