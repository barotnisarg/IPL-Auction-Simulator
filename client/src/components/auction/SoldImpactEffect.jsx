// client/src/components/auction/SoldImpactEffect.jsx

import { useState } from 'react';

const PARTICLE_COUNT = 46;

// Reuses the app's existing role/accent palette (amber, emerald, sky) so the
// burst feels like part of the same visual system, not a random rainbow.
const PARTICLE_COLORS = [
  'bg-amber-400',
  'bg-amber-300',
  'bg-emerald-400',
  'bg-sky-400',
  'bg-neutral-100',
];

const randomBetween = (min, max) => min + Math.random() * (max - min);

// Generates one particle's full randomized flight path + appearance.
// Simplified confetti physics: burst outward in every direction from the
// impact point, but gravity always wins in the end — fallY is forced
// positive regardless of the burst angle, so every particle ultimately
// drifts downward even if its initial trajectory was sideways or upward.
const createParticle = (index) => {
  const angle    = randomBetween(0, Math.PI * 2);
  const distance = randomBetween(70, 200);

  const driftX = Math.cos(angle) * distance;
  const fallY  = Math.abs(Math.sin(angle)) * distance * 0.6 + randomBetween(90, 200);

  const isRect = Math.random() > 0.5;

  return {
    id: index,
    color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
    size: randomBetween(5, 9),
    isRect,
    startXOffset: randomBetween(-14, 14),
    startYOffset: randomBetween(-14, 14),
    driftX: `${driftX}px`,
    fallY: `${fallY}px`,
    spin: `${randomBetween(480, 1080) * (Math.random() > 0.5 ? 1 : -1)}deg`,
    delayMs: randomBetween(0, 180),
    durationMs: randomBetween(1100, 1650),
  };
};

// Self-contained SOLD celebration layer: screen flash + rippling shockwave
// rings + a 46-piece confetti burst. Mounts fresh every time a player sells
// (the parent conditionally renders this component), so the particle set
// regenerates via the lazy useState initializer on every mount and the
// entire DOM subtree is cleaned up automatically on unmount — no leak
// across a full 55-player auction.
const SoldImpactEffect = () => {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Screen flash — the punch that lands a beat before the stamp reads clearly */}
      <div
        className="absolute inset-0 animate-screen-flash bg-[radial-gradient(circle,rgba(251,191,36,0.35),transparent_65%)]"
        aria-hidden="true"
      />

      {/* Shockwave rings — three ripples staggered 120ms apart */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
        {[0, 120, 240].map((delayMs) => (
          <span
            key={delayMs}
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-shockwave rounded-full border-amber-400"
            style={{ animationDelay: `${delayMs}ms` }}
          />
        ))}
      </div>

      {/* Confetti burst */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute left-1/2 top-1/2 animate-confetti-fall ${p.color} ${p.isRect ? 'rounded-sm' : 'rounded-full'}`}
          style={{
            width:      p.isRect ? `${p.size}px` : `${p.size * 0.8}px`,
            height:     p.isRect ? `${p.size * 1.8}px` : `${p.size * 0.8}px`,
            marginLeft: `${p.startXOffset}px`,
            marginTop:  `${p.startYOffset}px`,
            '--drift-x': p.driftX,
            '--fall-y':  p.fallY,
            '--spin':    p.spin,
            animationDelay:    `${p.delayMs}ms`,
            animationDuration: `${p.durationMs}ms`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

export default SoldImpactEffect;