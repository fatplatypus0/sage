import { useMemo } from 'react';

/**
 * The signature backdrop from the reference design: a deep-navy void, a sparse
 * star field, and one enormous glowing "planet limb" arc sweeping across the top.
 */
export function Starfield({ count = 130, className = '' }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    // Deterministic pseudo-random so SSR/CSR and re-renders never re-shuffle the sky.
    let seed = 20261113;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    return Array.from({ length: count }, (_, i) => {
      const r = rnd();
      return {
        id: i,
        x: rnd() * 100,
        y: rnd() * 100,
        size: r > 0.94 ? 2.4 : r > 0.78 ? 1.5 : 1,
        dim: 0.18 + rnd() * 0.7,
        delay: rnd() * 6,
        dur: 3 + rnd() * 5,
      };
    });
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.dim,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            boxShadow: s.size > 2 ? '0 0 6px 1px rgba(190,215,255,0.8)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Big glowing arc — the "dawn over a planet" horizon from the reference design.
 * Geometry: one enormous ellipse whose top edge is the visible arc (the "limb").
 * `apex` is the distance from the top of the clip box to the crest of the arc; the
 * clip box hides the rest of the ellipse so no stray curve leaks down the page.
 */
export function GlowArc({
  className = '',
  height = 560,
  apex = 88,
}: {
  className?: string;
  height?: number;
  apex?: number;
}) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${className}`} style={{ height }} aria-hidden="true">
      {/* atmospheric bloom across the sky above the limb */}
      <div
        className="absolute inset-0 animate-breathe"
        style={{
          background: `radial-gradient(62% ${apex * 3}px at 50% ${apex}px, rgba(120,170,255,0.4), rgba(46,88,226,0.16) 44%, transparent 72%)`,
        }}
      />
      {/* the planet dome: dark disc with a bright rim */}
      <div
        className="absolute left-1/2 h-[1400px] w-[1900px] -translate-x-1/2 rounded-[50%]"
        style={{
          top: apex,
          background:
            'radial-gradient(58% 40% at 50% 0%, rgba(56,98,222,0.4) 0%, rgba(16,32,84,0.5) 40%, rgba(3,7,26,0.96) 68%, #020619 100%)',
          border: '1px solid rgba(186,214,255,0.45)',
          boxShadow:
            '0 -1px 24px 0 rgba(176,208,255,0.5), 0 -6px 60px 4px rgba(110,160,255,0.34), 0 -22px 130px 26px rgba(56,110,255,0.24), inset 0 36px 90px -24px rgba(120,170,255,0.3)',
        }}
      />
      {/* the hot core of the limb */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: apex - 5,
          width: 720,
          height: 10,
          borderRadius: 999,
          background: 'radial-gradient(50% 100% at 50% 50%, rgba(240,248,255,0.95), rgba(176,212,255,0.4) 46%, transparent 78%)',
          filter: 'blur(5px)',
        }}
      />
      {/* horizon fade into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-900" />
    </div>
  );
}

/** Soft light spill used above the app panel (mirrors the reference product shot). */
export function TopSpill({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute -top-16 left-1/2 h-32 w-[86%] -translate-x-1/2 blur-2xl ${className}`}
      aria-hidden="true"
      style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(150,190,255,0.55), transparent 70%)' }}
    />
  );
}
