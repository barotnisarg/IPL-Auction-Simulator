// client/src/components/auction/EmojiReactionOverlay.jsx

// Renders the floating emoji reactions on top of the auction view.
// This component is purely presentational — it receives the reactions
// array from useReactions and renders each one as a CSS-animated floater.
// No socket logic, no Redux, no side effects.
//
// Placed as a fixed overlay in AuctionPage so reactions float over the
// entire screen rather than being clipped to a single card.

const EmojiReactionOverlay = ({ reactions }) => {
  if (!reactions.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {reactions.map((reaction) => (
        <span
          key={reaction.id}
          className="absolute bottom-24 select-none text-4xl"
          style={{
            left:              `${reaction.startX}%`,
            '--drift-x':       reaction.driftX,
            animationDuration: `${reaction.durationMs}ms`,
            // Use the float-up animation defined in tailwind.config.js.
            // We can't use the Tailwind class directly here because we need
            // to set a custom animationDuration per reaction — Tailwind
            // classes set a fixed duration. Inline style gives us the
            // per-instance variation while still using the same keyframe.
            animation: `floatUp ${reaction.durationMs}ms cubic-bezier(0.2, 0.8, 0.4, 1) both`,
          }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
};

export default EmojiReactionOverlay;