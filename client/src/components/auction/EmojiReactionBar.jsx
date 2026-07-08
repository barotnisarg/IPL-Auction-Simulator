// client/src/components/auction/EmojiReactionBar.jsx

import { useState } from 'react';

// The 8 emojis that make sense in an auction context.
// Ordered by how likely they are to be used during a heated bid.
const EMOJIS = [
  { emoji: '🔥', label: 'Fire'    },
  { emoji: '🤑', label: 'Money'   },
  { emoji: '😱', label: 'Shocked' },
  { emoji: '💰', label: 'Bag'     },
  { emoji: '👏', label: 'Clap'    },
  { emoji: '🚀', label: 'Rocket'  },
  { emoji: '😤', label: 'Hyped'   },
  { emoji: '💀', label: 'Dead'    },
];

// Cooldown mirror of the server-side rate limit (2000ms).
// The server enforces it authoritatively — this just gives immediate
// visual feedback so the user doesn't tap the same button three times
// wondering if it registered.
const CLIENT_COOLDOWN_MS = 2000;

const EmojiReactionBar = ({ onReact }) => {
  // Track which emoji is on cooldown (if any).
  const [cooldown, setCooldown] = useState(null);

  const handleTap = (emoji) => {
    if (cooldown) return;

    onReact(emoji);

    setCooldown(emoji);
    setTimeout(() => setCooldown(null), CLIENT_COOLDOWN_MS);
  };

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/90 px-2 py-1.5 backdrop-blur-sm"
      role="toolbar"
      aria-label="Send a reaction"
    >
      {EMOJIS.map(({ emoji, label }) => {
        const isOnCooldown = cooldown === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleTap(emoji)}
            disabled={Boolean(cooldown)}
            aria-label={`React with ${label}`}
            className={[
              'relative flex h-9 w-9 items-center justify-center rounded-lg text-xl',
              'transition-all duration-150 select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
              isOnCooldown
                ? 'scale-90 bg-amber-500/20 opacity-60'
                : cooldown
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-neutral-800 hover:scale-110 active:scale-95',
            ].join(' ')}
          >
            {emoji}
            {/* Cooldown drain ring */}
            {isOnCooldown && (
              <span
                className="pointer-events-none absolute inset-0 rounded-lg border-2 border-amber-500/60"
                style={{
                  animation: `cooldownDrain ${CLIENT_COOLDOWN_MS}ms linear forwards`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default EmojiReactionBar;