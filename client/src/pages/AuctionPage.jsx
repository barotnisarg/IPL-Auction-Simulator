// client/src/pages/AuctionPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import useAuctionRoom from '../hooks/useAuctionRoom';
import useReactions from '../hooks/useReactions';
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
import EmojiReactionBar from '../components/auction/EmojiReactionBar';
import EmojiReactionOverlay from '../components/auction/EmojiReactionOverlay';

const CATEGORY_INTRO_MS = 5000;

const AuctionPage = () => {
  const { roomCode } = useParams();
  const { room, roomStatus } = useAuctionRoom(roomCode);

  // ── Category panel ────────────────────────────────────────────────────
  const [isPanelOpen, setIsPanelOpen]               = useState(false);
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

  // ── Emoji reactions ───────────────────────────────────────────────────
  const { reactions, emitReaction } = useReactions();

  const handleReact = (emoji) => {
    if (!room?.roomCode) return;
    emitReaction(emoji, room.roomCode);
  };

  // ── Loading / error states ────────────────────────────────────────────
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
    <div className="min-h-dvh bg-neutral-950 pb-32 md:pb-6">
      {/* Floating emoji reactions — fixed overlay, above everything */}
      <EmojiReactionOverlay reactions={reactions} />

      {/* Category player list panel */}
      <CategoryPlayerListPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        autoCloseCountdown={autoCloseCountdown}
      />

      {/* ── Sticky top bar ── */}
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

          {/* Left: player card + history */}
          <div className="space-y-4 lg:col-span-2">
            <AuctionPlayerCard />
            <HistoryPanel type="bid" />
          </div>

          {/* Right: my team + others + log */}
          <div className="space-y-4">
            <MyTeamPanel />
            <OtherTeamsPanel />
            <HistoryPanel type="auction" />
          </div>
        </div>
      </main>

      {/* ── Mobile sticky bottom bar ── */}
      {/* Contains BidControls + EmojiReactionBar side by side.
          On desktop, BidControls renders inline inside AuctionPlayerCard
          and EmojiReactionBar sits in the main content area below the card. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-950/95 px-4 pb-safe backdrop-blur-sm md:hidden">
        <div className="flex items-end gap-2 pt-2 pb-3">
          <div className="flex-1">
            <BidControls compact />
          </div>
          <div className="shrink-0 pb-0.5">
            <EmojiReactionBar onReact={handleReact} />
          </div>
        </div>
      </div>

      {/* Desktop: EmojiReactionBar below the player card */}
      <div className="mx-auto hidden max-w-6xl px-4 md:block">
        <div className="mt-4 lg:w-2/3">
          <EmojiReactionBar onReact={handleReact} />
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;