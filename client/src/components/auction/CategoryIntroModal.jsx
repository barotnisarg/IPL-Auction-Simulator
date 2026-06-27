// client/src/components/auction/CategoryIntroModal.jsx

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissCategoryIntro } from "../../features/auction/auctionSlice";
import { formatLakhsAsDisplay } from "../../utils/formatCurrency";

const AUTO_DISMISS_MS = 5000;

const ROLE_DISPLAY = {
  batter: "BAT",
  "all-rounder": "AR",
  bowler: "BOWL",
  wicketkeeper: "WK",
};

const ROLE_COLOR = {
  batter: "text-sky-400 bg-sky-400/10",
  "all-rounder": "text-violet-400 bg-violet-400/10",
  bowler: "text-emerald-400 bg-emerald-400/10",
  wicketkeeper: "text-amber-400 bg-amber-400/10",
};

const CATEGORY_LABEL = {
  marquee: "Marquee Set",
  pool1: "Pool 1",
  pool2: "Pool 2",
  "mini-auction": "Mini Auction",
};

const CATEGORY_COLOR = {
  marquee: "text-amber-400",
  pool1: "text-sky-400",
  pool2: "text-violet-400",
  "mini-auction": "text-emerald-400",
};

const OutcomeBadge = ({ outcome }) => {
  if (!outcome) return null;
  if (outcome.type === "sold") {
    return (
      <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-xs font-bold text-emerald-400">
          {formatLakhsAsDisplay(outcome.priceLakhs)}
        </span>
        <span className="text-xs text-neutral-400 truncate max-w-[90px]">
          {outcome.teamName}
        </span>
      </div>
    );
  }
  return (
    <span className="ml-auto text-xs font-semibold text-neutral-500 shrink-0">
      Unsold
    </span>
  );
};

const CategoryIntroModal = () => {
  const dispatch = useDispatch();
  const { activeCategoryIntro, playerOutcomeMap } = useSelector(
    (state) => state.auction,
  );

  const [localIntro, setLocalIntro] = useState(null);
  const [countdown, setCountdown] = useState(Math.ceil(AUTO_DISMISS_MS / 1000));
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeCategoryIntro) return;

    setLocalIntro(activeCategoryIntro);
    setCountdown(Math.ceil(AUTO_DISMISS_MS / 1000));

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          dispatch(dismissCategoryIntro());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryIntro?.category, activeCategoryIntro?.roleSubPhase]);

  if (!activeCategoryIntro || !localIntro) return null;

  const { category, players } = localIntro;
  const catLabel = CATEGORY_LABEL[category] ?? category;
  const catColor = CATEGORY_COLOR[category] ?? "text-neutral-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Starting Now
            </p>
            <p className={`mt-0.5 text-2xl font-black ${catColor}`}>
              {catLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neutral-700 text-sm font-black text-neutral-300">
              {countdown}
            </div>
            <button
              onClick={() => {
                clearInterval(timerRef.current);
                dispatch(dismissCategoryIntro());
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {players.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              No players in this set.
            </p>
          ) : (
            <ul className="space-y-1">
              {players.map((player) => {
                const outcome = playerOutcomeMap[player._id?.toString()];
                return (
                  <li
                    key={player._id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-neutral-800/60"
                  >
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLOR[player.role] ?? "text-neutral-400 bg-neutral-700"}`}
                    >
                      {ROLE_DISPLAY[player.role] ?? player.role}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-100">
                        {player.name}
                      </p>
                      {player.country && (
                        <p className="text-xs text-neutral-500">
                          {player.country}
                        </p>
                      )}
                    </div>
                    {!outcome && (
                      <span className="shrink-0 text-xs text-neutral-500">
                        {formatLakhsAsDisplay(player.basePriceLakhs)}
                      </span>
                    )}
                    <OutcomeBadge outcome={outcome} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-6 py-3 text-center">
          <p className="text-xs text-neutral-500">
            Auction starts in{" "}
            <span className="font-bold text-neutral-300">{countdown}s</span> —
            or close to begin immediately
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryIntroModal;
